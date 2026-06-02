import type { McpContext } from '../types';
import { log } from '../logger';

interface DiagnosticsResourceResult {
    totalCount: number;
    diagnostics: Array<{
        file: string;
        line: number;
        column: number;
        code: string;
        message: string;
        severity: string;
    }>;
}

export async function readDiagnosticsResource(
    params: Record<string, string>,
    ctx: McpContext,
): Promise<DiagnosticsResourceResult> {
    const severity = params['severity'] ? params['severity'].split(',') : undefined;
    const limit = params['limit'] ? parseInt(params['limit'], 10) : 100;
    const filePattern = params['filePattern'] || undefined;

    log('debug', `Diagnostics resource query: severity=${severity}, limit=${limit}, filePattern=${filePattern}`);

    const result = ctx.diagnosticsStore.query({ severity, limit, filePattern });

    return {
        totalCount: result.totalCount,
        diagnostics: result.diagnostics,
    };
}
