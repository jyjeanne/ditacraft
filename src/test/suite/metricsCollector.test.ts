/**
 * Unit tests for MetricsCollector.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { MetricsCollector } from '../../llm/metricsCollector';

function makeChannel(): vscode.OutputChannel {
    // Minimal stub — only appendLine is called
    const lines: string[] = [];
    return {
        appendLine: (msg: string) => lines.push(msg),
        append: () => {},
        show: () => {},
        hide: () => {},
        clear: () => {},
        dispose: () => {},
        replace: () => {},
        name: 'test',
    } as unknown as vscode.OutputChannel;
}

function makeMetric(overrides: Partial<Parameters<MetricsCollector['record']>[0]> = {}) {
    return {
        provider: 'copilot',
        command: 'test',
        durationMs: 100,
        promptTokens: 10,
        completionTokens: 20,
        success: true,
        fallback: false,
        ...overrides,
    };
}

suite('MetricsCollector', () => {

    suite('record()', () => {
        test('records a metric entry', () => {
            const mc = new MetricsCollector(makeChannel());
            mc.record(makeMetric());
            assert.strictEqual(mc.getAll().length, 1);
        });

        test('timestamp is set automatically', () => {
            const before = Date.now();
            const mc = new MetricsCollector(makeChannel());
            mc.record(makeMetric());
            const after = Date.now();
            const entry = mc.getAll()[0];
            assert.ok(entry.timestamp >= before && entry.timestamp <= after,
                'timestamp should be set to current time');
        });

        test('getAll() returns a copy', () => {
            const mc = new MetricsCollector(makeChannel());
            mc.record(makeMetric());
            const all1 = mc.getAll();
            mc.record(makeMetric());
            // First snapshot should not be affected by the second record
            assert.strictEqual(all1.length, 1, 'getAll() should return a snapshot copy');
        });
    });

    suite('cap — max 1000 entries', () => {
        test('evicts old entries when cap is reached', () => {
            const mc = new MetricsCollector(makeChannel());
            // Insert 1001 entries
            for (let i = 0; i < 1001; i++) {
                mc.record(makeMetric({ command: `cmd-${i}` }));
            }
            const all = mc.getAll();
            assert.ok(all.length < 1001, 'should evict entries at cap');
            assert.ok(all.length >= 750, 'should retain most entries after eviction');
        });

        test('retains the most recent entries after eviction', () => {
            const mc = new MetricsCollector(makeChannel());
            for (let i = 0; i < 1001; i++) {
                mc.record(makeMetric({ command: `cmd-${i}` }));
            }
            const all = mc.getAll();
            // Most recent entry should always be present
            const last = all[all.length - 1];
            assert.strictEqual(last.command, 'cmd-1000', 'last entry should be the most recent');
        });
    });

    suite('getSummary()', () => {
        test('returns zeros for empty collector', () => {
            const mc = new MetricsCollector(makeChannel());
            const s = mc.getSummary();
            assert.strictEqual(s.total, 0);
            assert.strictEqual(s.successRate, 0);
            assert.strictEqual(s.avgDurationMs, 0);
            assert.deepStrictEqual(s.byProvider, {});
            assert.strictEqual(s.fallbackCount, 0);
        });

        test('calculates success rate correctly', () => {
            const mc = new MetricsCollector(makeChannel());
            mc.record(makeMetric({ success: true }));
            mc.record(makeMetric({ success: true }));
            mc.record(makeMetric({ success: false }));
            const s = mc.getSummary();
            assert.strictEqual(s.total, 3);
            assert.ok(Math.abs(s.successRate - (2 / 3)) < 0.001);
        });

        test('counts fallbacks correctly', () => {
            const mc = new MetricsCollector(makeChannel());
            mc.record(makeMetric({ fallback: false }));
            mc.record(makeMetric({ fallback: true }));
            mc.record(makeMetric({ fallback: true }));
            const s = mc.getSummary();
            assert.strictEqual(s.fallbackCount, 2);
        });

        test('groups by provider', () => {
            const mc = new MetricsCollector(makeChannel());
            mc.record(makeMetric({ provider: 'copilot' }));
            mc.record(makeMetric({ provider: 'copilot' }));
            mc.record(makeMetric({ provider: 'anthropic' }));
            const s = mc.getSummary();
            assert.strictEqual(s.byProvider['copilot'], 2);
            assert.strictEqual(s.byProvider['anthropic'], 1);
        });

        test('calculates average duration', () => {
            const mc = new MetricsCollector(makeChannel());
            mc.record(makeMetric({ durationMs: 100 }));
            mc.record(makeMetric({ durationMs: 200 }));
            mc.record(makeMetric({ durationMs: 300 }));
            const s = mc.getSummary();
            assert.strictEqual(s.avgDurationMs, 200);
        });
    });

    suite('clear()', () => {
        test('removes all entries', () => {
            const mc = new MetricsCollector(makeChannel());
            mc.record(makeMetric());
            mc.record(makeMetric());
            mc.clear();
            assert.strictEqual(mc.getAll().length, 0);
        });

        test('summary returns zeros after clear', () => {
            const mc = new MetricsCollector(makeChannel());
            mc.record(makeMetric());
            mc.clear();
            const s = mc.getSummary();
            assert.strictEqual(s.total, 0);
        });
    });
});
