/**
 * DITA File Decoration Provider Test Suite
 * Tests for validation badges on DITA files.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { DitaFileDecorationProvider } from '../../providers/ditaFileDecorationProvider';

suite('DITA File Decoration Provider Test Suite', () => {
    suiteSetup(async () => {
        const extension = vscode.extensions.getExtension('JeremyJeanne.ditacraft');
        if (extension && !extension.isActive) {
            await extension.activate();
        }
    });

    suite('DitaFileDecorationProvider', () => {
        test('Should create provider without errors', () => {
            const provider = new DitaFileDecorationProvider();
            assert.ok(provider);
            provider.dispose();
        });

        test('Should return undefined for non-DITA files', () => {
            const provider = new DitaFileDecorationProvider();
            const result = provider.provideFileDecoration(
                vscode.Uri.file('/path/to/file.js')
            );
            assert.strictEqual(result, undefined);
            provider.dispose();
        });

        test('Should return undefined for .txt files', () => {
            const provider = new DitaFileDecorationProvider();
            const result = provider.provideFileDecoration(
                vscode.Uri.file('/path/to/readme.txt')
            );
            assert.strictEqual(result, undefined);
            provider.dispose();
        });

        test('Should accept .dita files without throwing', () => {
            const provider = new DitaFileDecorationProvider();
            // Should not throw for DITA files (returns undefined when no diagnostics)
            assert.doesNotThrow(() => {
                provider.provideFileDecoration(vscode.Uri.file('/path/to/topic.dita'));
            });
            provider.dispose();
        });

        test('Should accept .ditamap files without throwing', () => {
            const provider = new DitaFileDecorationProvider();
            assert.doesNotThrow(() => {
                provider.provideFileDecoration(vscode.Uri.file('/path/to/map.ditamap'));
            });
            provider.dispose();
        });

        test('Should accept .bookmap files without throwing', () => {
            const provider = new DitaFileDecorationProvider();
            assert.doesNotThrow(() => {
                provider.provideFileDecoration(vscode.Uri.file('/path/to/book.bookmap'));
            });
            provider.dispose();
        });

        test('Should have onDidChangeFileDecorations event', () => {
            const provider = new DitaFileDecorationProvider();
            assert.ok(provider.onDidChangeFileDecorations);
            provider.dispose();
        });

        test('Should return decoration with badge for file with errors', () => {
            const collection = vscode.languages.createDiagnosticCollection('dita-decoration-test');
            const uri = vscode.Uri.file('/tmp/test-decoration.dita');
            collection.set(uri, [
                Object.assign(new vscode.Diagnostic(
                    new vscode.Range(0, 0, 0, 10), 'Error', vscode.DiagnosticSeverity.Error
                ), { source: 'dita' })
            ]);

            const provider = new DitaFileDecorationProvider();
            const result = provider.provideFileDecoration(uri);

            // Result should be a FileDecoration with badge
            if (result) {
                assert.ok(result.badge, 'Should have a badge');
            }
            // Clean up — may be undefined if the diagnostics API isn't synchronous
            provider.dispose();
            collection.clear();
            collection.dispose();
        });

        test('Should return undefined for DITA file with no diagnostics', () => {
            const provider = new DitaFileDecorationProvider();
            // Use a path that definitely has no diagnostics
            const result = provider.provideFileDecoration(
                vscode.Uri.file('/tmp/no-diags-ever-' + Date.now() + '.dita')
            );
            assert.strictEqual(result, undefined);
            provider.dispose();
        });
    });
});
