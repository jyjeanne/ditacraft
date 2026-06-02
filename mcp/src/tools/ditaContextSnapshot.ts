import type { McpContext } from '../server';
import { handleBuildContextSnapshot, BuildContextSnapshotParams, ContextSnapshotResult } from '../../../server/src/features/contextSnapshot';
import { resolvePath } from '../workspace';

interface DitaContextSnapshotArgs {
    uri: string;
    maxTokens?: number;
    strategy?: 'breadth-first' | 'depth-first' | 'by-relevance';
    focusUri?: string;
}

export function handleDitaContextSnapshot(
    args: unknown,
    ctx: McpContext,
): ContextSnapshotResult {
    const { uri, maxTokens, strategy, focusUri } = args as DitaContextSnapshotArgs;

    const resolvedUri = resolvePath(uri, ctx.workspaceRoot);
    if (!resolvedUri) {
        throw new Error(`Invalid or unsafe path: ${uri}`);
    }

    const params: BuildContextSnapshotParams = {
        uri: resolvedUri,
        maxTokens: maxTokens ?? 8000,
        strategy: strategy ?? 'breadth-first',
        focusUri,
    };

    return handleBuildContextSnapshot(params, ctx.keySpaceService);
}
