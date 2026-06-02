import * as assert from 'assert';
import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver-types';
import { DiagnosticsStore } from '../src/diagnosticsStore';

suite('DiagnosticsStore', () => {

    function makeDiag(
        code: string,
        message: string,
        severity: DiagnosticSeverity,
        line: number,
        col: number = 1,
    ): Diagnostic {
        return {
            code,
            message,
            severity,
            range: {
                start: { line: line - 1, character: col - 1 },
                end: { line: line - 1, character: col + 10 },
            },
        };
    }

    test('accumulates diagnostics per file URI', () => {
        const store = new DiagnosticsStore();
        store.update('file:///ws/topics/a.dita', [
            makeDiag('DITA-STRUCT-001', 'Missing DOCTYPE', 1, 1),
        ]);
        store.update('file:///ws/topics/b.dita', [
            makeDiag('DITA-STRUCT-003', 'Missing title', 1, 1),
        ]);
        const result = store.query();
        assert.strictEqual(result.totalCount, 2);
    });

    test('query() returns all diagnostics by default', () => {
        const store = new DiagnosticsStore();
        store.update('file:///ws/topics/a.dita', [
            makeDiag('DITA-STRUCT-001', 'Missing DOCTYPE', 1, 1),
            makeDiag('DITA-SCH-016', 'Recommendation', 2, 5),
        ]);
        const result = store.query();
        assert.strictEqual(result.totalCount, 2);
    });

    test('query() filters by severity', () => {
        const store = new DiagnosticsStore();
        store.update('file:///ws/topics/a.dita', [
            makeDiag('E1', 'Error', 1, 1),
            makeDiag('W1', 'Warning', 2, 2),
            makeDiag('I1', 'Info', 3, 3),
            makeDiag('H1', 'Hint', 4, 4),
        ]);
        const result = store.query({ severity: ['error'] });
        assert.strictEqual(result.totalCount, 1);
        assert.strictEqual(result.diagnostics[0].code, 'E1');
    });

    test('query() filters by multiple severities', () => {
        const store = new DiagnosticsStore();
        store.update('file:///ws/topics/a.dita', [
            makeDiag('E1', 'Error', 1, 1),
            makeDiag('W1', 'Warning', 2, 2),
        ]);
        const result = store.query({ severity: ['error', 'warning'] });
        assert.strictEqual(result.totalCount, 2);
    });

    test('query() filters by file pattern glob', () => {
        const store = new DiagnosticsStore();
        store.update('file:///ws/topics/a.dita', [makeDiag('E1', 'Err', 1, 1)]);
        store.update('file:///ws/other/b.dita', [makeDiag('E2', 'Err', 1, 1)]);
        const result = store.query({ filePattern: 'topics/*' });
        assert.strictEqual(result.totalCount, 1);
        assert.ok(result.diagnostics[0].file.includes('topics'));
    });

    suite('globToRegex anchoring (regression for *.dita matching .ditamap)', () => {

        test('*.dita does NOT match .ditamap files', () => {
            const store = new DiagnosticsStore();
            store.update('file:///ws/topics/a.ditamap', [makeDiag('E1', 'Err', 1, 1)]);
            store.update('file:///ws/topics/b.dita', [makeDiag('E2', 'Err', 1, 1)]);
            const result = store.query({ filePattern: '*.dita' });
            assert.strictEqual(result.totalCount, 1);
            assert.ok(result.diagnostics[0].code === 'E2');
        });

        test('topics/* matches files in topics/ but not other/', () => {
            const store = new DiagnosticsStore();
            store.update('file:///ws/topics/a.dita', [makeDiag('E1', 'Err', 1, 1)]);
            store.update('file:///ws/other/a.dita', [makeDiag('E2', 'Err', 1, 1)]);
            const result = store.query({ filePattern: 'topics/*' });
            assert.strictEqual(result.totalCount, 1);
            assert.strictEqual(result.diagnostics[0].code, 'E1');
        });

        test('**/*.dita matches dita files at any depth', () => {
            const store = new DiagnosticsStore();
            store.update('file:///ws/a/b/c.dita', [makeDiag('E1', 'Err', 1, 1)]);
            store.update('file:///ws/a/b/c.ditamap', [makeDiag('E2', 'Err', 1, 1)]);
            const result = store.query({ filePattern: '**/*.dita' });
            assert.strictEqual(result.totalCount, 1);
            assert.strictEqual(result.diagnostics[0].code, 'E1');
        });

    });

    test('query() respects limit', () => {
        const store = new DiagnosticsStore();
        store.update('file:///ws/a.dita', [
            makeDiag('E1', 'E1', 1, 1),
            makeDiag('E2', 'E2', 1, 2),
            makeDiag('E3', 'E3', 1, 3),
        ]);
        const result = store.query({ limit: 2 });
        assert.strictEqual(result.diagnostics.length, 2);
        assert.strictEqual(result.totalCount, 3);
    });

    test('update() replaces previous diagnostics for same URI', () => {
        const store = new DiagnosticsStore();
        store.update('file:///ws/a.dita', [makeDiag('E1', 'First', 1, 1)]);
        store.update('file:///ws/a.dita', [makeDiag('E2', 'Second', 1, 1)]);
        const result = store.query();
        assert.strictEqual(result.totalCount, 1);
        assert.strictEqual(result.diagnostics[0].code, 'E2');
    });

    test('clear() removes all stored diagnostics', () => {
        const store = new DiagnosticsStore();
        store.update('file:///ws/a.dita', [makeDiag('E1', 'Err', 1, 1)]);
        store.clear();
        const result = store.query();
        assert.strictEqual(result.totalCount, 0);
    });

    test('handles empty diagnostics array (valid file, no errors)', () => {
        const store = new DiagnosticsStore();
        store.update('file:///ws/valid.dita', []);
        const result = store.query();
        assert.strictEqual(result.totalCount, 0);
    });

    suite('globToRegex path-boundary anchor (fix: (?:^|/) prefix)', () => {

        test('topics/*.dita does NOT match file in bad-topics/ directory', () => {
            const store = new DiagnosticsStore();
            store.update('file:///ws/bad-topics/a.dita', [makeDiag('E1', 'Err', 1, 1)]);
            store.update('file:///ws/topics/b.dita', [makeDiag('E2', 'Err', 1, 1)]);

            const result = store.query({ filePattern: 'topics/*.dita' });
            assert.strictEqual(result.totalCount, 1, 'should only match topics/, not bad-topics/');
            assert.ok(result.diagnostics[0].file.includes('/topics/b.dita'));
        });

        test('topics/*.dita does NOT match sub-topics/ directory', () => {
            const store = new DiagnosticsStore();
            store.update('file:///ws/sub-topics/c.dita', [makeDiag('E1', 'Err', 1, 1)]);
            const result = store.query({ filePattern: 'topics/*.dita' });
            assert.strictEqual(result.totalCount, 0, 'sub-topics/ should not match topics/ pattern');
        });

        test('topics/*.dita matches a file directly in topics/', () => {
            const store = new DiagnosticsStore();
            store.update('file:///ws/topics/d.dita', [makeDiag('E1', 'Err', 1, 1)]);
            const result = store.query({ filePattern: 'topics/*.dita' });
            assert.strictEqual(result.totalCount, 1);
        });
    });
});
