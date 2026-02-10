/**
 * Key Space View Provider Test Suite
 * Tests for the Key Space tree view provider.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { KeySpaceViewProvider, KeySpaceItem } from '../../providers/keySpaceViewProvider';
import { scanKeyUsages } from '../../utils/keyUsageScanner';

suite('Key Space View Provider Test Suite', () => {
    suiteSetup(async () => {
        const extension = vscode.extensions.getExtension('JeremyJeanne.ditacraft');
        if (extension && !extension.isActive) {
            await extension.activate();
        }
    });

    suite('KeySpaceItem', () => {
        test('Should create group item', () => {
            const item = new KeySpaceItem(
                'Defined Keys (5)',
                'group',
                vscode.TreeItemCollapsibleState.Expanded
            );
            assert.strictEqual(item.label, 'Defined Keys (5)');
            assert.strictEqual(item.kind, 'group');
            assert.strictEqual(item.contextValue, 'keyGroup');
        });

        test('Should create key item with definition', () => {
            const item = new KeySpaceItem(
                'product-name',
                'key',
                vscode.TreeItemCollapsibleState.Collapsed,
                'product-name',
                {
                    keyName: 'product-name',
                    targetFile: '/path/to/product.dita',
                    sourceMap: '/path/to/root.ditamap'
                }
            );
            assert.strictEqual(item.label, 'product-name');
            assert.strictEqual(item.kind, 'key');
            assert.strictEqual(item.contextValue, 'keyItem');
            assert.ok(item.description);
        });

        test('Should create key item with inline content', () => {
            const item = new KeySpaceItem(
                'version',
                'key',
                vscode.TreeItemCollapsibleState.None,
                'version',
                {
                    keyName: 'version',
                    inlineContent: '3.0.1',
                    sourceMap: '/path/to/root.ditamap'
                }
            );
            assert.strictEqual(item.description, '(inline)');
        });

        test('Should create usage item', () => {
            const usage = {
                uri: vscode.Uri.file('/path/to/topic.dita'),
                range: new vscode.Range(5, 10, 5, 25),
                keyName: 'product-name',
                type: 'keyref' as const
            };
            const item = new KeySpaceItem(
                'topic.dita',
                'usage',
                vscode.TreeItemCollapsibleState.None,
                'product-name',
                undefined,
                usage
            );
            assert.strictEqual(item.kind, 'usage');
            assert.strictEqual(item.contextValue, 'keyUsage');
            assert.ok(item.command);
            assert.strictEqual(item.command!.command, 'vscode.open');
        });

        test('Should build tooltip for key with target file', () => {
            const item = new KeySpaceItem(
                'product-name',
                'key',
                vscode.TreeItemCollapsibleState.None,
                'product-name',
                {
                    keyName: 'product-name',
                    targetFile: '/path/to/product.dita',
                    sourceMap: '/path/to/root.ditamap',
                    scope: 'local'
                }
            );
            const tooltip = item.tooltip as string;
            assert.ok(tooltip.includes('product-name'));
            assert.ok(tooltip.includes('product.dita'));
            assert.ok(tooltip.includes('local'));
        });
    });

    suite('KeySpaceViewProvider', () => {
        test('Should create provider without errors', () => {
            const provider = new KeySpaceViewProvider();
            assert.ok(provider);
            provider.dispose();
        });

        test('Should fire onDidChangeTreeData on refresh', (done) => {
            const provider = new KeySpaceViewProvider();
            provider.onDidChangeTreeData(() => {
                provider.dispose();
                done();
            });
            provider.refresh();
        });

        test('Should return tree item as-is', () => {
            const provider = new KeySpaceViewProvider();
            const item = new KeySpaceItem(
                'Test',
                'group',
                vscode.TreeItemCollapsibleState.Expanded
            );
            assert.strictEqual(provider.getTreeItem(item), item);
            provider.dispose();
        });

        test('Should return children from item', async () => {
            const provider = new KeySpaceViewProvider();
            const child = new KeySpaceItem(
                'child-key',
                'key',
                vscode.TreeItemCollapsibleState.None,
                'child-key'
            );
            const parent = new KeySpaceItem(
                'Defined Keys (1)',
                'group',
                vscode.TreeItemCollapsibleState.Expanded,
                undefined,
                undefined,
                undefined,
                [child]
            );

            const children = await provider.getChildren(parent);
            assert.strictEqual(children.length, 1);
            assert.strictEqual(children[0].label, 'child-key');
            provider.dispose();
        });
    });

    suite('KeySpaceViewProvider root getChildren', () => {
        test('Should return array for root getChildren call', async () => {
            const provider = new KeySpaceViewProvider();
            const items = await provider.getChildren(undefined);
            assert.ok(Array.isArray(items));
            provider.dispose();
        });

        test('Should return groups (if workspace has maps/keyrefs)', async () => {
            const provider = new KeySpaceViewProvider();
            const items = await provider.getChildren(undefined);
            // Each item should be a KeySpaceItem with kind 'group'
            for (const item of items) {
                assert.strictEqual(item.kind, 'group');
                assert.ok(item.children);
            }
            provider.dispose();
        });

        test('Should cache results on second call', async () => {
            const provider = new KeySpaceViewProvider();
            const items1 = await provider.getChildren(undefined);
            const items2 = await provider.getChildren(undefined);
            assert.strictEqual(items1, items2, 'Second call should return cached result');
            provider.dispose();
        });

        test('Should clear cache on refresh', async () => {
            const provider = new KeySpaceViewProvider();
            const items1 = await provider.getChildren(undefined);
            provider.refresh();
            const items2 = await provider.getChildren(undefined);
            // After refresh, should rebuild (not same reference)
            if (items1.length > 0) {
                assert.notStrictEqual(items1, items2, 'Should rebuild after refresh');
            }
            provider.dispose();
        });
    });

    suite('scanKeyUsages integration', () => {
        const hasWorkspace = () => vscode.workspace.workspaceFolders !== undefined
            && vscode.workspace.workspaceFolders.length > 0;

        test('Should return a Map', async () => {
            const usages = await scanKeyUsages();
            assert.ok(usages instanceof Map);
        });

        test('Should find keyref usages in workspace fixture files', async function () {
            if (!hasWorkspace()) { this.skip(); return; }
            const usages = await scanKeyUsages();
            assert.ok(usages.size > 0, 'Should find at least one keyref usage');
        });

        test('Should have correct KeyUsage structure', async () => {
            const usages = await scanKeyUsages();
            for (const [keyName, keyUsages] of usages) {
                assert.ok(typeof keyName === 'string');
                assert.ok(keyName.length > 0);
                for (const u of keyUsages) {
                    assert.ok(u.uri instanceof vscode.Uri);
                    assert.ok(u.range instanceof vscode.Range);
                    assert.ok(u.type === 'keyref' || u.type === 'conkeyref');
                    assert.ok(typeof u.keyName === 'string');
                }
            }
        });

        test('Should detect conkeyref type correctly', async function () {
            if (!hasWorkspace()) { this.skip(); return; }
            const usages = await scanKeyUsages();
            const allUsages = Array.from(usages.values()).flat();
            const conkeyrefs = allUsages.filter(u => u.type === 'conkeyref');
            assert.ok(conkeyrefs.length > 0, 'Should find at least one conkeyref usage');
        });

        test('Should strip key name before slash for conkeyref', async () => {
            const usages = await scanKeyUsages();
            const allUsages = Array.from(usages.values()).flat();
            const conkeyrefs = allUsages.filter(u => u.type === 'conkeyref');
            for (const u of conkeyrefs) {
                assert.ok(!u.keyName.includes('/'), `Key name should not contain slash: ${u.keyName}`);
            }
        });

        test('Should return empty map when no workspace is open', async function () {
            if (hasWorkspace()) { this.skip(); return; }
            const usages = await scanKeyUsages();
            assert.strictEqual(usages.size, 0);
        });
    });

    suite('Command Registration', () => {
        test('Should have refreshKeySpace command registered', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.refreshKeySpace'),
                'ditacraft.refreshKeySpace command should be registered'
            );
        });
    });
});
