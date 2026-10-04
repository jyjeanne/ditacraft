import type { McpContext } from '../types';
import { log } from '../logger';
import { invalidParameter } from './query';

export const DIAGNOSTICS_URI = 'dita://workspace/diagnostics';
export const DIAGNOSTICS_PARAMETERS = ['severity', 'limit', 'filePattern'] as const;

const SEVERITIES = ['error', 'warning', 'information', 'hint'];

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
    const severity = params['severity'] ? parseSeverities(params['severity']) : undefined;
    const limit = params['limit'] ? parseLimit(params['limit']) : 100;
    const filePattern = params['filePattern'] || undefined;

    log('debug', `Diagnostics resource query: severity=${severity}, limit=${limit}, filePattern=${filePattern}`);

    const result = ctx.diagnosticsStore.query({ severity, limit, filePattern });

    return {
        totalCount: result.totalCount,
        diagnostics: result.diagnostics,
    };
}

/** `error,warning`: the severities to keep (`info` is accepted for `information`). */
function parseSeverities(value: string): string[] {
    return value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean).map((s) => {
        const severity = s === 'info' ? 'information' : s;
        if (!SEVERITIES.includes(severity)) {
            throw invalidParameter(`Unknown severity "${s}": use ${SEVERITIES.join(', ')} (comma-separated).`);
        }
        return severity;
    });
}

/** The most diagnostics to return; 0 returns them all. */
function parseLimit(value: string): number {
    if (!/^\d+$/.test(value.trim())) {
        throw invalidParameter(`"limit" must be a whole number (0 for no limit), not "${value}".`);
    }
    return parseInt(value, 10);
}
