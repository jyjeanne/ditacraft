/**
 * @ditacraft Chat Participant — registers DitaCraft as a Copilot Chat participant.
 *
 * Supported slash commands (spec §2.1.1):
 *   /restructure — Propose a restructured DITA map (F2 via chat)
 *   /validate    — Explain and propose a fix for a DITA validation error
 *
 * Phase 3 will add: /explain, /suggest-reuse
 */

import * as vscode from 'vscode';
import { AIServiceOrchestrator } from '../llm/aiServiceOrchestrator';
import { getErrorMessage } from '../utils/errorUtils';

const PARTICIPANT_ID = 'ditacraft';

const HELP_MESSAGE = [
    '**DitaCraft AI Assistant** 🗂️',
    '',
    'Available commands:',
    '- `@ditacraft /restructure <intention>` — Propose a restructured DITA map based on your intention.',
    '- `@ditacraft /validate` — Explain a DITA validation error on the current selection.',
    '- `@ditacraft /explain` — Explain the semantic structure of the selected DITA element.',
    '- `@ditacraft /suggest-reuse` — Identify conref/keyref reuse opportunities in the current map.',
    '',
    'Open a `.ditamap` file and try: `@ditacraft /restructure Group topics by audience`',
].join('\n');

/**
 * Create and register the @ditacraft Chat Participant.
 * Returns the participant so it can be added to context.subscriptions.
 */
export function createDitacraftParticipant(
    context: vscode.ExtensionContext,
    orchestrator: AIServiceOrchestrator
): vscode.ChatParticipant {
    const participant = vscode.chat.createChatParticipant(
        PARTICIPANT_ID,
        (request, _ctx, response, token) =>
            handleRequest(request, response, token, orchestrator, context)
    );

    participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'resources', 'icon.png');
    return participant;
}

// ── Request handler ────────────────────────────────────────────────────────

async function handleRequest(
    request: vscode.ChatRequest,
    response: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
    orchestrator: AIServiceOrchestrator,
    _context: vscode.ExtensionContext
): Promise<void> {
    if (!request.command) {
        response.markdown(HELP_MESSAGE);
        return;
    }

    switch (request.command) {
        case 'restructure':
            await handleRestructure(request, response, token, orchestrator);
            break;
        case 'validate':
            await handleValidate(request, response, token, orchestrator);
            break;
        case 'explain':
            await handleExplain(request, response, token, orchestrator);
            break;
        case 'suggest-reuse':
            await handleSuggestReuse(request, response, token, orchestrator);
            break;
        default:
            response.markdown(`Unknown command \`/${request.command}\`.\n\n${HELP_MESSAGE}`);
    }
}

// ── /restructure ──────────────────────────────────────────────────────────

async function handleRestructure(
    request: vscode.ChatRequest,
    response: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
    orchestrator: AIServiceOrchestrator
): Promise<void> {
    const editor = vscode.window.activeTextEditor;

    if (!editor || !editor.document.uri.fsPath.endsWith('.ditamap')) {
        response.markdown(
            '⚠️ **No `.ditamap` file is active.** Open a DITA map file and try again.'
        );
        return;
    }

    const intention = request.prompt.trim();
    if (!intention) {
        response.markdown(
            '❓ Please provide your restructuring intention.\n\n' +
            'Example: `@ditacraft /restructure Group topics by audience type`'
        );
        return;
    }

    const mapUri = editor.document.uri.toString();
    response.markdown(`**Restructuring** \`${editor.document.uri.fsPath}\`...\n\n`);
    response.progress('Building DITA context snapshot...');

    try {
        const result = await orchestrator.restructureMap(
            mapUri,
            intention,
            chunk => response.markdown(chunk),
            token
        );

        if (!result.success) {
            response.markdown(`\n\n❌ **Restructuring failed:** ${result.error}`);
            return;
        }

        if (result.model) {
            response.markdown(`\n\n---\n*Powered by ${result.model} · Validated by DitaCraft LSP*`);
        }
    } catch (error: unknown) {
        response.markdown(`\n\n❌ **Error:** ${getErrorMessage(error)}`);
    }
}

// ── /validate ─────────────────────────────────────────────────────────────

async function handleValidate(
    request: vscode.ChatRequest,
    response: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
    orchestrator: AIServiceOrchestrator
): Promise<void> {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        response.markdown('⚠️ **No file is active.** Open a DITA file and select a problem in the editor.');
        return;
    }

    const docUri = editor.document.uri;
    const diagnostics = vscode.languages.getDiagnostics(docUri);

    if (diagnostics.length === 0) {
        response.markdown('✅ No diagnostics found on the active file.');
        return;
    }

    // Find diagnostic at cursor, or use the first one
    const cursorPos = editor.selection.active;
    const target = diagnostics.find(d => d.range.contains(cursorPos)) ?? diagnostics[0];

    const selection = editor.selection;
    const fragment = selection.isEmpty
        ? editor.document.lineAt(target.range.start.line).text
        : editor.document.getText(selection);

    const codeLabel = typeof target.code === 'object' ? String(target.code.value) : String(target.code ?? 'unknown');
    const prompt = request.prompt.trim();
    const userQuestion = prompt ? ` — User question: "${prompt}"` : '';

    response.markdown(`**Explaining diagnostic \`${codeLabel}\`**${userQuestion}:\n\n> ${target.message}\n\n`);
    response.progress('Analyzing with AI...');

    try {
        await orchestrator.explainDiagnostic(
            fragment,
            target,
            docUri.toString(),
            chunk => response.markdown(chunk),
            token
        );
        response.markdown('\n\n---\n*💡 Use `Ctrl+.` to apply AI Quick Fixes directly in the editor.*');
    } catch (error: unknown) {
        response.markdown(`\n\n❌ **Error:** ${getErrorMessage(error)}`);
    }
}

// ── /explain ──────────────────────────────────────────────────────────────

async function handleExplain(
    request: vscode.ChatRequest,
    response: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
    orchestrator: AIServiceOrchestrator
): Promise<void> {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        response.markdown('⚠️ **No file is active.** Open a DITA file and select an element.');
        return;
    }

    const selection = editor.selection;
    const elementXml = selection.isEmpty
        ? editor.document.lineAt(selection.active.line).text.trim()
        : editor.document.getText(selection);

    if (!elementXml) {
        response.markdown('❓ **Select a DITA element** in the editor, then run `/explain`.');
        return;
    }

    // Best-effort: find enclosing map URI
    const docUri = editor.document.uri;
    const mapUri = docUri.fsPath.endsWith('.ditamap')
        ? docUri.toString()
        : docUri.toString(); // Use the document URI; snapshot handler will handle non-map

    const prompt = request.prompt.trim();
    response.markdown(`**Explaining selected DITA element:**\n\n\`\`\`xml\n${elementXml.slice(0, 200)}\n\`\`\`\n`);
    response.progress('Analyzing element semantics...');

    try {
        await orchestrator.explainElement(
            elementXml,
            mapUri,
            chunk => response.markdown(chunk),
            token,
            prompt || undefined  // pass user focus separately from XML
        );
    } catch (error: unknown) {
        response.markdown(`\n\n❌ **Error:** ${getErrorMessage(error)}`);
    }
}

// ── /suggest-reuse ────────────────────────────────────────────────────────

async function handleSuggestReuse(
    request: vscode.ChatRequest,
    response: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
    orchestrator: AIServiceOrchestrator
): Promise<void> {
    const editor = vscode.window.activeTextEditor;

    if (!editor || !editor.document.uri.fsPath.endsWith('.ditamap')) {
        response.markdown(
            '⚠️ **No `.ditamap` file is active.** Open a DITA map file and try again.'
        );
        return;
    }

    const mapUri = editor.document.uri.toString();
    const prompt = request.prompt.trim();
    if (prompt) {
        response.markdown(`**Finding reuse opportunities** (focus: *${prompt}*)...\n\n`);
    } else {
        response.markdown('**Finding conref/keyref reuse opportunities** in this map...\n\n');
    }
    response.progress('Analyzing map structure...');

    try {
        await orchestrator.suggestReuse(
            mapUri,
            chunk => response.markdown(chunk),
            token
        );
        response.markdown('\n\n---\n*Tip: Use `<conkeyref>` for context-sensitive reuse and `<keyref>` for variable text.*');
    } catch (error: unknown) {
        response.markdown(`\n\n❌ **Error:** ${getErrorMessage(error)}`);
    }
}
