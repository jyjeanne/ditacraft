/**
 * MetricsCollector — records AI call statistics.
 *
 * Tracks: provider, duration, token estimates, success/failure, fallback count.
 * Writes a summary line to the DitaCraft output channel when telemetry is enabled.
 * All data is in-process only — nothing is transmitted externally.
 */

import * as vscode from 'vscode';

export interface AICallMetric {
    provider: string;
    command: string;
    durationMs: number;
    promptTokens: number;
    completionTokens: number;
    success: boolean;
    fallback: boolean;
    error?: string;
    timestamp: number;
}

export class MetricsCollector {
    private readonly _metrics: AICallMetric[] = [];
    private readonly _channel: vscode.OutputChannel;
    private static readonly MAX_ENTRIES = 1000;

    constructor(channel: vscode.OutputChannel) {
        this._channel = channel;
    }

    /** Record a completed AI call. Older entries are evicted once the cap is reached. */
    record(metric: Omit<AICallMetric, 'timestamp'>): void {
        const full: AICallMetric = { ...metric, timestamp: Date.now() };

        if (this._metrics.length >= MetricsCollector.MAX_ENTRIES) {
            // Evict the oldest quarter to amortise the cost of frequent trimming
            this._metrics.splice(0, Math.floor(MetricsCollector.MAX_ENTRIES / 4));
        }

        this._metrics.push(full);

        const cfg = vscode.workspace.getConfiguration('ditacraft.ai');
        if (!cfg.get<boolean>('telemetry.enabled', false)) { return; }

        const status = metric.success ? '✔' : '✘';
        const fallbackTag = metric.fallback ? ' [fallback]' : '';
        const errTag = metric.error ? ` — ${metric.error}` : '';
        const tokens = metric.promptTokens + metric.completionTokens;
        this._channel.appendLine(
            `[AI] ${status} ${metric.command} via ${metric.provider}${fallbackTag} ` +
            `${metric.durationMs}ms ~${tokens}tok${errTag}`
        );
    }

    /** Returns a copy of all recorded metrics. */
    getAll(): readonly AICallMetric[] {
        return [...this._metrics];
    }

    /** Summary stats for a simple metrics dashboard. */
    getSummary(): {
        total: number;
        successRate: number;
        avgDurationMs: number;
        byProvider: Record<string, number>;
        fallbackCount: number;
    } {
        const total = this._metrics.length;
        if (total === 0) {
            return { total: 0, successRate: 0, avgDurationMs: 0, byProvider: {}, fallbackCount: 0 };
        }

        const successes = this._metrics.filter(m => m.success).length;
        const totalDuration = this._metrics.reduce((s, m) => s + m.durationMs, 0);
        const byProvider: Record<string, number> = {};
        let fallbackCount = 0;

        for (const m of this._metrics) {
            byProvider[m.provider] = (byProvider[m.provider] ?? 0) + 1;
            if (m.fallback) { fallbackCount++; }
        }

        return {
            total,
            successRate: successes / total,
            avgDurationMs: totalDuration / total,
            byProvider,
            fallbackCount,
        };
    }

    /** Clear all recorded metrics. */
    clear(): void {
        this._metrics.length = 0;
    }
}
