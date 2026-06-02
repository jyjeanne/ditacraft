"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDitaExplainKey = handleDitaExplainKey;
const workspace_1 = require("../workspace");
async function handleDitaExplainKey(args, ctx) {
    const { keyName, contextFilePath } = args;
    const resolved = (0, workspace_1.resolvePath)(contextFilePath, ctx.workspaceRoot);
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
//# sourceMappingURL=ditaExplainKey.js.map