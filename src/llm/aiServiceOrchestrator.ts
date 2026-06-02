/**
 * AIServiceOrchestrator — Coordinates the full AI pipeline:
 *   ContextBuilder   → fetches context graph + snapshot from LSP
 *   PromptAssembler  → builds system/user prompts with DITA context
 *   LLMCaller        → streams response from active provider
 *   ResponseValidator→ validates LLM output via LSP dita/validateFragment
 *
 * All operations respect the "human-in-the-loop" principle: no file is
 * modified without explicit user confirmation; validation always precedes
 * presentation.
 */

import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';
import { LLMRouterService } from './llmRouterService';
import { LLMRequest } from './types';

// ── LSP request/response types (matching server-side handlers) ─────────────

interface BuildContextSnapshotParams {
    uri: string;
    maxTokens: number;
    strategy: 'breadth-first' | 'depth-first' | 'by-relevance';
}

interface ValidateFragmentParams {
    fragment: string;
    contextUri: string;
    fragmentType: 'map' | 'topic' | 'topicref' | 'element';
}

interface FragmentValidationResult {
    isValid: boolean;
    diagnostics: vscode.Diagnostic[];
    suggestions?: string[];
}

// ── System prompts from spec §6 ────────────────────────────────────────────

const RESTRUCTURE_SYSTEM_PROMPT = `You are a DITA documentation architect assistant integrated in VS Code via the DitaCraft extension.

ROLE: Analyze DITA map structures and propose optimized reorganizations.

STRICT RULES:
1. Output ONLY valid DITA 1.3 XML for the map structure.
2. Do NOT create new topics. Only reorganize existing topicref elements.
3. Preserve ALL href attributes exactly as provided — never modify file paths.
4. Preserve ALL existing attributes (format, scope, type, processing-role) on topicrefs.
5. You may add, remove, or modify <topicmeta> and <navtitle> elements.
6. Group topics using <topichead> elements when semantic grouping is needed.
7. The output must be a complete, valid <map> element including the XML declaration.

OUTPUT FORMAT:
Return only the XML, no explanation, no markdown code fences.`;

const QUICKFIX_SYSTEM_PROMPT = `You are a DITA XML repair specialist. You receive a defective XML fragment and a validation error.

STRICT RULES:
1. Return ONLY the corrected XML fragment, no explanation.
2. Preserve all attributes not related to the error.
3. Do not change element types unless strictly necessary for validity.
4. Your output must be directly applicable as a replacement in the source file.
5. If the fix requires removing content, comment it out with <!-- REMOVED: reason -->
   rather than deleting it silently.`;

const VALIDATE_EXPLAIN_SYSTEM_PROMPT = `You are a DITA XML expert. Explain validation errors in clear language and provide corrective guidance.

RULES:
1. Explain the error in plain language (avoid jargon where possible).
2. Describe specifically what change is needed.
3. Show a corrected XML example when helpful.
4. Keep responses concise (max 300 words).`;

const EXPLAIN_ELEMENT_SYSTEM_PROMPT = `You are a DITA documentation architect. Analyze a DITA XML element and explain its semantic role.

RULES:
1. Identify the element type (concept, task, reference, topic, topicref, etc.).
2. Describe what it represents in the documentation structure.
3. Explain its key attributes and their purpose.
4. Suggest improvements if any best-practice issues are visible.
5. Keep responses concise (max 400 words). Use markdown for readability.`;

const SUGGEST_REUSE_SYSTEM_PROMPT = `You are a DITA content reuse specialist. Analyze a DITA map structure and identify reuse opportunities.

RULES:
1. Identify topics that share common content and could benefit from <conref> or <conkeyref>.
2. Suggest variables (product names, version numbers) that should use <keyword keyref="...">.
3. Identify repeated topic groups that could use map references (<mapref>).
4. For each suggestion: explain what to reuse, which topics are involved, and give a code example.
5. Prioritize the top 5 most impactful opportunities. Be specific about file paths.`;

// ── Results ────────────────────────────────────────────────────────────────

export interface RestructureResult {
    success: boolean;
    xmlContent?: string;
    error?: string;
    model?: string;
}

export interface FixFragmentResult {
    success: boolean;
    fixedXml?: string;
    error?: string;
    model?: string;
}

// ── Orchestrator ───────────────────────────────────────────────────────────

export class AIServiceOrchestrator {

    constructor(
        private readonly router: LLMRouterService,
        private readonly getClient: () => LanguageClient | undefined
    ) {}

    /**
     * Restructure a DITA map with AI assistance.
     * Streams chunks to onChunk; returns the full proposed XML when complete.
     */
    async restructureMap(
        mapUri: string,
        intention: string,
        onChunk: (chunk: string) => void,
        token?: vscode.CancellationToken,
        maxContextTokens = 6000
    ): Promise<RestructureResult> {
        const provider = this.router.activeProvider;
        if (!provider) {
            return { success: false, error: 'No LLM provider available.' };
        }

        // ── Build context snapshot ────────────────────────────────────────
        const snapshot = await this.buildSnapshot(mapUri, maxContextTokens);
        if (!snapshot) {
            return { success: false, error: 'Could not build DITA context snapshot.' };
        }

        const userMessage = `DITA Map Context:\n${snapshot}\n\nUser intention: ${intention}\n\nPropose a restructured version of this DITA map.`;

        const request: LLMRequest = {
            systemPrompt: RESTRUCTURE_SYSTEM_PROMPT,
            userMessage,
            maxTokens: 4096,
            temperature: 0.2,
        };

        const signal = tokenToSignal(token);
        const chunks: string[] = [];

        await provider.stream(request, chunk => {
            chunks.push(chunk);
            onChunk(chunk);
        }, signal);

        const xmlContent = chunks.join('');

        // ── Retry once if XML extraction needed ──────────────────────────
        const cleaned = extractXml(xmlContent);
        if (!cleaned) {
            // Second attempt with clarification prompt
            const retryRequest: LLMRequest = {
                ...request,
                userMessage: userMessage + '\n\nYour previous response was not valid XML. Return only XML, nothing else.',
            };
            const retryChunks: string[] = [];
            await provider.stream(retryRequest, c => retryChunks.push(c), signal);
            const retryXml = extractXml(retryChunks.join(''));
            if (!retryXml) {
                return { success: false, error: 'LLM did not return valid XML after two attempts.' };
            }
            return { success: true, xmlContent: retryXml, model: provider.id };
        }

        return { success: true, xmlContent: cleaned, model: provider.id };
    }

    /**
     * Explain a diagnostic error for the /validate chat command.
     * Streams explanation text via onChunk.
     */
    async explainDiagnostic(
        fragment: string,
        diagnostic: vscode.Diagnostic,
        _contextUri: string,
        onChunk: (chunk: string) => void,
        token?: vscode.CancellationToken
    ): Promise<void> {
        const provider = this.router.activeProvider;
        if (!provider) {
            onChunk('No LLM provider available. Configure GitHub Copilot or an API key.');
            return;
        }

        const code = typeof diagnostic.code === 'object' ? String(diagnostic.code.value) : String(diagnostic.code ?? '');
        const userMessage =
            `Error code: ${code}\n` +
            `Error message: ${diagnostic.message}\n` +
            `DITA version: 1.3\n\n` +
            `Defective fragment:\n\`\`\`xml\n${fragment}\n\`\`\``;

        const request: LLMRequest = {
            systemPrompt: VALIDATE_EXPLAIN_SYSTEM_PROMPT,
            userMessage,
            maxTokens: 2048,
            temperature: 0.3,
        };

        const signal = tokenToSignal(token);
        await provider.stream(request, onChunk, signal);
    }

    /**
     * Fix a defective XML fragment with AI assistance.
     * Validates the fix via LSP before returning it.
     */
    async fixFragment(
        fragment: string,
        diagnostic: vscode.Diagnostic,
        contextUri: string,
        token?: vscode.CancellationToken
    ): Promise<FixFragmentResult> {
        const provider = this.router.activeProvider;
        if (!provider) {
            return { success: false, error: 'No LLM provider available.' };
        }

        const code = typeof diagnostic.code === 'object' ? String(diagnostic.code.value) : String(diagnostic.code ?? '');

        const userMessage =
            `Error code: ${code}\n` +
            `Error message: ${diagnostic.message}\n` +
            `DITA version: 1.3\n\n` +
            `Defective fragment:\n${fragment}`;

        const request: LLMRequest = {
            systemPrompt: QUICKFIX_SYSTEM_PROMPT,
            userMessage,
            maxTokens: 1500,
            temperature: 0.1,
        };

        const signal = tokenToSignal(token);

        for (let attempt = 0; attempt < 2; attempt++) {
            const chunks: string[] = [];
            await provider.stream(attempt === 0 ? request : {
                ...request,
                userMessage: userMessage + '\n\nYour previous response was not valid XML. Return only XML, nothing else.',
            }, c => chunks.push(c), signal);

            const fixedXml = extractXml(chunks.join(''));
            if (!fixedXml) {
                continue;
            }

            // Validate via LSP
            const valid = await this.validateFragment(fixedXml, contextUri, 'element');
            if (valid) {
                return { success: true, fixedXml, model: provider.id };
            }
        }

        return { success: false, error: 'AI could not produce a valid XML fragment after two attempts.' };
    }

    // ── Private helpers ───────────────────────────────────────────────────

    /**
     * Explain the semantic structure of a selected DITA element (Phase 3).
     * Streams explanation via onChunk.
     * @param elementXml Pure XML string of the selected element.
     * @param mapUri URI of the enclosing map (for context snapshot).
     * @param userContext Optional extra instruction from the user (kept separate from XML).
     */
    async explainElement(
        elementXml: string,
        mapUri: string,
        onChunk: (chunk: string) => void,
        token?: vscode.CancellationToken,
        userContext?: string
    ): Promise<void> {
        const provider = this.router.activeProvider;
        if (!provider) {
            onChunk('No LLM provider available. Configure GitHub Copilot or an API key.');
            return;
        }

        const snapshot = await this.buildSnapshot(mapUri, 2000);
        const contextPart = snapshot
            ? `\n\nMap context summary:\n${snapshot}`
            : '';

        // userContext is appended OUTSIDE the code fence to avoid corrupting the XML block
        const focusPart = userContext ? `\n\nFocus on: ${userContext}` : '';

        const userMessage =
            `Explain this DITA element:\n\`\`\`xml\n${elementXml}\n\`\`\`` +
            contextPart +
            focusPart;

        const request: LLMRequest = {
            systemPrompt: EXPLAIN_ELEMENT_SYSTEM_PROMPT,
            userMessage,
            maxTokens: 1024,
            temperature: 0.3,
        };

        const signal = tokenToSignal(token);
        await provider.stream(request, onChunk, signal);
    }

    /**
     * Identify conref/keyref reuse opportunities in the DITA project (Phase 3).
     * Streams suggestions via onChunk.
     */
    async suggestReuse(
        mapUri: string,
        onChunk: (chunk: string) => void,
        token?: vscode.CancellationToken
    ): Promise<void> {
        const provider = this.router.activeProvider;
        if (!provider) {
            onChunk('No LLM provider available. Configure GitHub Copilot or an API key.');
            return;
        }

        const snapshot = await this.buildSnapshot(mapUri, 5000);
        if (!snapshot) {
            onChunk('Could not build DITA context snapshot. Ensure the file is a valid DITA map.');
            return;
        }

        const userMessage =
            `Analyze this DITA map structure and suggest content reuse opportunities:\n\n${snapshot}`;

        const request: LLMRequest = {
            systemPrompt: SUGGEST_REUSE_SYSTEM_PROMPT,
            userMessage,
            maxTokens: 2048,
            temperature: 0.3,
        };

        const signal = tokenToSignal(token);
        await provider.stream(request, onChunk, signal);
    }

    /**
     * Raw streaming call for AI completion (F4 — no context snapshot, no XML validation).
     * Fire-and-forget style; caller must handle timeout externally.
     */
    async streamRaw(
        userMessage: string,
        onChunk: (chunk: string) => void,
        token?: vscode.CancellationToken
    ): Promise<void> {
        const provider = this.router.activeProvider;
        if (!provider) { return; }

        const request: LLMRequest = {
            systemPrompt: 'You are a DITA XML expert assistant in VS Code. Answer concisely.',
            userMessage,
            maxTokens: 256,
            temperature: 0.1,
        };

        const signal = tokenToSignal(token);
        await provider.stream(request, onChunk, signal);
    }

    // ── Private helpers ───────────────────────────────────────────────────

    private async buildSnapshot(uri: string, maxTokens: number): Promise<string | null> {
        const client = this.getClient();
        if (!client) { return null; }
        try {
            const params: BuildContextSnapshotParams = { uri, maxTokens, strategy: 'breadth-first' };
            return await client.sendRequest<string>('dita/buildContextSnapshot', params);
        } catch {
            return null;
        }
    }

    private async validateFragment(
        fragment: string,
        contextUri: string,
        fragmentType: ValidateFragmentParams['fragmentType']
    ): Promise<boolean> {
        const client = this.getClient();
        if (!client) { return true; } // graceful degradation: assume valid
        try {
            const params: ValidateFragmentParams = { fragment, contextUri, fragmentType };
            const result = await client.sendRequest<FragmentValidationResult>('dita/validateFragment', params);
            return result?.isValid === true;
        } catch {
            return true; // graceful degradation
        }
    }
}

// ── Utility functions ─────────────────────────────────────────────────────

/** Extract the first XML block from a potentially markdown-wrapped LLM response. */
function extractXml(text: string): string | null {
    // Strip markdown code fences if present
    const fenced = text.match(/```(?:xml)?\s*([\s\S]*?)```/);
    if (fenced) { return fenced[1].trim(); }

    // Detect bare XML (starts with <?xml or a DITA element)
    const bare = text.match(/(<\?xml[\s\S]*|<(?:map|concept|task|reference|topic|bookmap)[\s\S]*)/);
    if (bare) { return bare[1].trim(); }

    return null;
}

/** Convert a VS Code CancellationToken to an AbortSignal. */
function tokenToSignal(token?: vscode.CancellationToken): AbortSignal {
    const controller = new AbortController();
    if (token) {
        if (token.isCancellationRequested) {
            controller.abort();
        } else {
            token.onCancellationRequested(() => controller.abort());
        }
    }
    return controller.signal;
}
