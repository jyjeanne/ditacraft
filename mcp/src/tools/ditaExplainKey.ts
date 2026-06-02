import type { McpContext } from '../types';
import { resolvePath } from '../workspace';

interface DitaExplainKeyArgs {
    keyName: string;
    contextFilePath: string;
}

interface ExplainKeyResult {
    keyName: string;
    contextFilePath: string;
    contextScope?: string;
    resolved: boolean;
    definition?: {
        keyName: string;
        targetUri?: string;
        sourceFile?: string;
        sourceLine?: number;
    };
    steps: Array<{
        type: string;
        attempted: string;
        found: boolean;
        note: string;
    }>;
}

export async function handleDitaExplainKey(
    args: unknown,
    ctx: McpContext,
): Promise<ExplainKeyResult> {
    const { keyName, contextFilePath } = args as DitaExplainKeyArgs;

    const resolved = resolvePath(contextFilePath, ctx.workspaceRoot);
    if (!resolved) {
        throw new Error(`Invalid or unsafe path: ${contextFilePath}`);
    }

    const fsPath = resolved.replace(/^file:\/\/\/?/, '');

    const report = await ctx.keySpaceService.explainKey(keyName, fsPath);

    const isResolved = report.resolvedDefinition !== null && report.resolvedDefinition !== undefined;

    return {
        keyName: report.keyName,
        contextFilePath: report.contextFilePath,
        contextScope: report.contextScope,
        resolved: isResolved,
        definition: report.resolvedDefinition
            ? {
                keyName: report.resolvedDefinition.keyName,
                targetUri: report.resolvedDefinition.targetFile
                    ? `file://${report.resolvedDefinition.targetFile.replace(/\\/g, '/')}`
                    : undefined,
                sourceFile: report.resolvedDefinition.sourceMap,
                sourceLine: report.resolvedDefinition.sourceLine,
            }
            : undefined,
        steps: report.steps.map((s) => ({
            type: s.type,
            attempted: s.attempted,
            found: s.found,
            note: s.note,
        })),
    };
}
