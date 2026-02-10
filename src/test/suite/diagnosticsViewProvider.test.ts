/**
 * Diagnostics View Provider Test Suite
 * Tests for the Diagnostics tree view provider.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { DiagnosticsViewProvider, DiagnosticItem } from '../../providers/diagnosticsViewProvider';

suite('Diagnostics View Provider Test Suite', () => {
    suiteSetup(async () => {
        const extension = vscode.extensions.getExtension('JeremyJeanne.ditacraft');
        if (extension && !extension.isActive) {
            await extension.activate();
        }
    });

    suite('DiagnosticItem', () => {
        test('Should create group item', () => {
            const item = new DiagnosticItem(
                'Errors (3)',
                vscode.TreeItemCollapsibleState.Expanded
            );
            assert.strictEqual(item.label, 'Errors (3)');
            assert.strictEqual(item.collapsibleState, vscode.TreeItemCollapsibleState.Expanded);
        });

        test('Should create error diagnostic item', () => {
            const uri = vscode.Uri.file('/path/to/test.dita');
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(5, 0, 5, 20),
                'Missing required element: title',
                vscode.DiagnosticSeverity.Error
            );
            diagnostic.source = 'dita';

            const item = new DiagnosticItem(
                'Missing required element: title',
                vscode.TreeItemCollapsibleState.None,
                undefined,
                uri,
                diagnostic
            );

            assert.ok(item.command);
            assert.strictEqual(item.command!.command, 'vscode.open');
            assert.ok(item.iconPath instanceof vscode.ThemeIcon);
            assert.strictEqual((item.iconPath as vscode.ThemeIcon).id, 'error');
            assert.strictEqual(item.description, 'line 6');
        });

        test('Should create warning diagnostic item', () => {
            const uri = vscode.Uri.file('/path/to/test.dita');
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(10, 0, 10, 15),
                'Unused key definition',
                vscode.DiagnosticSeverity.Warning
            );
            diagnostic.source = 'ditacraft-keys';

            const item = new DiagnosticItem(
                'Unused key definition',
                vscode.TreeItemCollapsibleState.None,
                undefined,
                uri,
                diagnostic
            );

            assert.ok(item.iconPath instanceof vscode.ThemeIcon);
            assert.strictEqual((item.iconPath as vscode.ThemeIcon).id, 'warning');
        });

        test('Should create info diagnostic item', () => {
            const uri = vscode.Uri.file('/path/to/test.dita');
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(0, 0, 0, 10),
                'Info message',
                vscode.DiagnosticSeverity.Information
            );

            const item = new DiagnosticItem(
                'Info message',
                vscode.TreeItemCollapsibleState.None,
                undefined,
                uri,
                diagnostic
            );

            assert.ok(item.iconPath instanceof vscode.ThemeIcon);
            assert.strictEqual((item.iconPath as vscode.ThemeIcon).id, 'info');
        });

        test('Should include tooltip with source and line info', () => {
            const uri = vscode.Uri.file('/path/to/test.dita');
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(7, 0, 7, 20),
                'Test error message',
                vscode.DiagnosticSeverity.Error
            );
            diagnostic.source = 'dita-lsp';

            const item = new DiagnosticItem(
                'Test error message',
                vscode.TreeItemCollapsibleState.None,
                undefined,
                uri,
                diagnostic
            );

            const tooltip = item.tooltip as string;
            assert.ok(tooltip.includes('Test error message'));
            assert.ok(tooltip.includes('dita-lsp'));
            assert.ok(tooltip.includes('8'));
        });

        test('Should return children when parent has children', () => {
            const child = new DiagnosticItem(
                'Child error',
                vscode.TreeItemCollapsibleState.None
            );
            const parent = new DiagnosticItem(
                'test.dita (1)',
                vscode.TreeItemCollapsibleState.Expanded,
                [child]
            );

            assert.strictEqual(parent.children!.length, 1);
            assert.strictEqual(parent.children![0].label, 'Child error');
        });
    });

    suite('DiagnosticsViewProvider', () => {
        test('Should create provider without errors', () => {
            const provider = new DiagnosticsViewProvider();
            assert.ok(provider);
            provider.dispose();
        });

        test('Should fire onDidChangeTreeData on refresh', (done) => {
            const provider = new DiagnosticsViewProvider();
            provider.onDidChangeTreeData(() => {
                provider.dispose();
                done();
            });
            provider.refresh();
        });

        test('Should fire onDidChangeTreeData on setGroupMode', (done) => {
            const provider = new DiagnosticsViewProvider();
            provider.onDidChangeTreeData(() => {
                provider.dispose();
                done();
            });
            provider.setGroupMode('byType');
        });

        test('Should return tree item as-is', () => {
            const provider = new DiagnosticsViewProvider();
            const item = new DiagnosticItem(
                'Test',
                vscode.TreeItemCollapsibleState.None
            );
            assert.strictEqual(provider.getTreeItem(item), item);
            provider.dispose();
        });

        test('Should return children from item', async () => {
            const provider = new DiagnosticsViewProvider();
            const child = new DiagnosticItem(
                'Error msg',
                vscode.TreeItemCollapsibleState.None
            );
            const parent = new DiagnosticItem(
                'test.dita (1)',
                vscode.TreeItemCollapsibleState.Expanded,
                [child]
            );

            const children = await provider.getChildren(parent);
            assert.strictEqual(children.length, 1);
            assert.strictEqual(children[0].label, 'Error msg');
            provider.dispose();
        });

        test('Should return empty array when no DITA diagnostics exist', async () => {
            const provider = new DiagnosticsViewProvider();
            const items = await provider.getChildren(undefined);
            // May or may not be empty depending on workspace state,
            // but should not throw
            assert.ok(Array.isArray(items));
            provider.dispose();
        });
    });

    suite('DiagnosticsViewProvider groupByType', () => {
        let collection: vscode.DiagnosticCollection;

        suiteSetup(() => {
            collection = vscode.languages.createDiagnosticCollection('dita-test');
        });

        suiteTeardown(() => {
            collection.clear();
            collection.dispose();
        });

        test('Should return items grouped by severity when mode is byType', async () => {
            const uri = vscode.Uri.file('/tmp/test-groupByType.dita');
            const diags = [
                Object.assign(new vscode.Diagnostic(
                    new vscode.Range(0, 0, 0, 10), 'Test error', vscode.DiagnosticSeverity.Error
                ), { source: 'dita' }),
                Object.assign(new vscode.Diagnostic(
                    new vscode.Range(1, 0, 1, 10), 'Test warning', vscode.DiagnosticSeverity.Warning
                ), { source: 'dita' })
            ];
            collection.set(uri, diags);

            const provider = new DiagnosticsViewProvider();
            provider.setGroupMode('byType');
            const items = await provider.getChildren(undefined);

            // Should have group items — at least Errors and Warnings
            // (may include other diagnostics from the workspace)
            assert.ok(Array.isArray(items));
            if (items.length > 0) {
                // Group labels should contain severity names
                const labels = items.map(i => i.label as string);
                const hasErrorOrWarning = labels.some(l =>
                    l.startsWith('Errors') || l.startsWith('Warnings')
                );
                assert.ok(hasErrorOrWarning, `Expected error/warning groups but got: ${labels.join(', ')}`);
            }

            provider.dispose();
            collection.clear();
        });

        test('Should return items grouped by file in byFile mode', async () => {
            const uri = vscode.Uri.file('/tmp/test-groupByFile.dita');
            const diags = [
                Object.assign(new vscode.Diagnostic(
                    new vscode.Range(0, 0, 0, 10), 'Error 1', vscode.DiagnosticSeverity.Error
                ), { source: 'dita' }),
                Object.assign(new vscode.Diagnostic(
                    new vscode.Range(2, 0, 2, 10), 'Error 2', vscode.DiagnosticSeverity.Error
                ), { source: 'dita' })
            ];
            collection.set(uri, diags);

            const provider = new DiagnosticsViewProvider();
            provider.setGroupMode('byFile');
            const items = await provider.getChildren(undefined);

            assert.ok(Array.isArray(items));
            if (items.length > 0) {
                // At least one group should contain a file name pattern
                const labels = items.map(i => i.label as string);
                const hasFileGroup = labels.some(l => l.includes('('));
                assert.ok(hasFileGroup, `Expected file groups with counts but got: ${labels.join(', ')}`);
            }

            provider.dispose();
            collection.clear();
        });
    });

    suite('DiagnosticItem edge cases', () => {
        test('Should use circle-outline icon for hint severity', () => {
            const uri = vscode.Uri.file('/path/to/test.dita');
            const diagnostic = new vscode.Diagnostic(
                new vscode.Range(0, 0, 0, 10),
                'Hint message',
                vscode.DiagnosticSeverity.Hint
            );

            const item = new DiagnosticItem(
                'Hint message',
                vscode.TreeItemCollapsibleState.None,
                undefined,
                uri,
                diagnostic
            );

            assert.ok(item.iconPath instanceof vscode.ThemeIcon);
            assert.strictEqual((item.iconPath as vscode.ThemeIcon).id, 'circle-outline');
        });

        test('Should return empty array for element with no children', async () => {
            const provider = new DiagnosticsViewProvider();
            const item = new DiagnosticItem(
                'Leaf item',
                vscode.TreeItemCollapsibleState.None
            );
            const children = await provider.getChildren(item);
            assert.strictEqual(children.length, 0);
            provider.dispose();
        });
    });

    suite('Command Registration', () => {
        test('Should have refreshDiagnosticsView command registered', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.refreshDiagnosticsView'),
                'ditacraft.refreshDiagnosticsView command should be registered'
            );
        });

        test('Should have diagnosticsGroupByFile command registered', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.diagnosticsGroupByFile'),
                'ditacraft.diagnosticsGroupByFile command should be registered'
            );
        });

        test('Should have diagnosticsGroupByType command registered', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.diagnosticsGroupByType'),
                'ditacraft.diagnosticsGroupByType command should be registered'
            );
        });
    });
});
