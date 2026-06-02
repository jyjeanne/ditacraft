import { TextDocument } from 'vscode-languageserver-textdocument';
import { Diagnostic } from 'vscode-languageserver-types';
import * as fs from 'fs';
import * as path from 'path';

import type { McpContext } from '../types';
import { resolvePath, fileExists } from '../workspace';
import { handleValidateFragment } from '../../../server/src/features/fragmentValidator';
import { log } from '../logger';
import { defaultMcpSettings } from '../mcpSettings';

interface DitaValidateArgs {
    uri?: string;
    fragment?: string;
    fragmentType?: 'map' | 'topic' | 'topicref' | 'element';
}

interface DitaValidateResult {
    isValid: boolean;
    filePath: string;
    diagnostics: SerializedDiagnostic[];
    errorCount: number;
    warningCount: number;
    validationTimeMs: number;
}

interface SerializedDiagnostic {
    code: string;
    message: string;
    severity: string;
    line: number;
    column: number;
    endLine: number;
    endColumn: number;
}

export async function handleDitaValidate(
    args: unknown,
    ctx: McpContext,
): Promise<DitaValidateResult | { error: string }> {
    const { uri, fragment, fragmentType } = args as DitaValidateArgs;

    log('debug', `dita_validate: uri=${uri}, fragment=${fragment ? 'present' : 'none'}`);

    if (!uri && !fragment) {
        return { error: 'Either "uri" or "fragment" is required', isValid: false, filePath: '', diagnostics: [], errorCount: 0, warningCount: 0, validationTimeMs: 0 };
    }

    if (fragment && !fragmentType) {
        return { error: '"fragmentType" is required when "fragment" is provided', isValid: false, filePath: '', diagnostics: [], errorCount: 0, warningCount: 0, validationTimeMs: 0 };
    }

    const startTime = Date.now();

    let diagnostics: Diagnostic[] = [];
    let filePath = '';

    if (fragment) {
        // Fragment validation
        const result = await handleValidateFragment(
            {
                fragment,
                contextUri: `ditacraft-fragment:///fragment.${fragmentType === 'map' ? 'ditamap' : 'dita'}`,
                fragmentType: fragmentType!,
            },
            ctx.validationPipeline,
        );
        diagnostics = result.diagnostics;
        filePath = '(fragment)';
    } else if (uri) {
        // File validation
        const resolvedUri = resolvePath(uri, ctx.workspaceRoot);
        if (!resolvedUri) {
            return { error: `Invalid or unsafe path: ${uri}`, isValid: false, filePath: uri, diagnostics: [], errorCount: 0, warningCount: 0, validationTimeMs: 0 };
        }

        const fsPath = resolvedUri.replace(/^file:\/\/\/?/, '');
        if (!fileExists(uri, ctx.workspaceRoot)) {
            return { error: `File not found in workspace: ${uri}`, isValid: false, filePath: uri, diagnostics: [], errorCount: 0, warningCount: 0, validationTimeMs: 0 };
        }

        const content = fs.readFileSync(fsPath, 'utf-8');
        const ext = path.extname(fsPath).toLowerCase();
        const langId = ext === '.ditamap' ? 'ditamap' : ext === '.bookmap' ? 'bookmap' : 'dita';
        const document = TextDocument.create(resolvedUri, langId, 0, content);

        filePath = uri;

        const settings = defaultMcpSettings();

        diagnostics = await ctx.validationPipeline.validate(
            document, settings, ctx.keySpaceService,
            { rootIdIndex: new Map(), unusedTopicPaths: new Set() },
        );

        // Update diagnostics store
        ctx.diagnosticsStore.update(resolvedUri, diagnostics);
    }

    const elapsed = Date.now() - startTime;
    let errorCount = 0;
    let warningCount = 0;

    const serialized: SerializedDiagnostic[] = diagnostics.map((d) => {
        const sev = diagnosticSeverity(d.severity);
        if (sev === 'error') errorCount++;
        if (sev === 'warning') warningCount++;
        return {
            code: typeof d.code === 'string' ? d.code : String(d.code ?? ''),
            message: d.message,
            severity: sev,
            line: d.range.start.line + 1,
            column: d.range.start.character + 1,
            endLine: d.range.end.line + 1,
            endColumn: d.range.end.character + 1,
        };
    });

    log('debug', `Validated "${filePath}": ${errorCount} errors, ${warningCount} warnings (${elapsed}ms)`);

    return {
        isValid: errorCount === 0,
        filePath,
        diagnostics: serialized,
        errorCount,
        warningCount,
        validationTimeMs: elapsed,
    };
}

function diagnosticSeverity(severity?: number): string {
    switch (severity) {
        case 1: return 'error';
        case 2: return 'warning';
        case 3: return 'information';
        case 4: return 'hint';
        default: return 'information';
    }
}
