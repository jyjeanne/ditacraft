"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDitaContextSnapshot = handleDitaContextSnapshot;
const contextSnapshot_1 = require("../../../server/src/features/contextSnapshot");
const workspace_1 = require("../workspace");
function handleDitaContextSnapshot(args, ctx) {
    const { uri, maxTokens, strategy, focusUri } = args;
    const resolvedUri = (0, workspace_1.resolvePath)(uri, ctx.workspaceRoot);
    if (!resolvedUri) {
        throw new Error(`Invalid or unsafe path: ${uri}`);
    }
    const params = {
        uri: resolvedUri,
        maxTokens: maxTokens ?? 8000,
        strategy: strategy ?? 'breadth-first',
        focusUri,
    };
    return (0, contextSnapshot_1.handleBuildContextSnapshot)(params, ctx.keySpaceService);
}
//# sourceMappingURL=ditaContextSnapshot.js.map