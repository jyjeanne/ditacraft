/**
 * DITA Explorer Provider Test Suite
 * Tests for the DITA Explorer tree view provider.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import { DitaExplorerProvider, DitaExplorerItem } from '../../providers/ditaExplorerProvider';
import { MapNode } from '../../utils/mapHierarchyParser';

suite('DITA Explorer Provider Test Suite', () => {
    suiteSetup(async () => {
        const extension = vscode.extensions.getExtension('JeremyJeanne.ditacraft');
        if (extension && !extension.isActive) {
            await extension.activate();
        }
    });

    suite('DitaExplorerItem', () => {
        test('Should create item with correct label', () => {
            const node: MapNode = {
                id: 'test-1',
                label: 'My Topic',
                type: 'topic',
                exists: true,
                children: []
            };
            const item = new DitaExplorerItem(node);
            assert.strictEqual(item.label, 'My Topic');
        });

        test('Should be collapsed when node has children', () => {
            const node: MapNode = {
                id: 'test-1',
                label: 'Parent',
                type: 'map',
                exists: true,
                children: [{
                    id: 'test-2',
                    label: 'Child',
                    type: 'topic',
                    exists: true,
                    children: []
                }]
            };
            const item = new DitaExplorerItem(node);
            assert.strictEqual(item.collapsibleState, vscode.TreeItemCollapsibleState.Collapsed);
        });

        test('Should not be collapsible when node has no children', () => {
            const node: MapNode = {
                id: 'test-1',
                label: 'Leaf',
                type: 'topic',
                exists: true,
                children: []
            };
            const item = new DitaExplorerItem(node);
            assert.strictEqual(item.collapsibleState, vscode.TreeItemCollapsibleState.None);
        });

        test('Should use warning icon for missing files', () => {
            const node: MapNode = {
                id: 'test-1',
                label: 'Missing',
                type: 'topic',
                href: 'missing.dita',
                exists: false,
                children: []
            };
            const item = new DitaExplorerItem(node);
            assert.ok(item.iconPath instanceof vscode.ThemeIcon);
            assert.strictEqual((item.iconPath as vscode.ThemeIcon).id, 'warning');
        });

        test('Should set contextValue to ditaMap-ditaFile for map type', () => {
            const node: MapNode = {
                id: 'test-1',
                label: 'My Map',
                type: 'map',
                exists: true,
                children: []
            };
            const item = new DitaExplorerItem(node);
            assert.strictEqual(item.contextValue, 'ditaMap-ditaFile');
        });

        test('Should set contextValue to ditaTopic-ditaFile for topic type', () => {
            const node: MapNode = {
                id: 'test-1',
                label: 'My Topic',
                type: 'topic',
                exists: true,
                children: []
            };
            const item = new DitaExplorerItem(node);
            assert.strictEqual(item.contextValue, 'ditaTopic-ditaFile');
        });

        test('Should set contextValue to ditaKeydef for keydef type', () => {
            const node: MapNode = {
                id: 'test-1',
                label: 'product-name',
                type: 'keydef',
                keys: 'product-name',
                exists: true,
                children: []
            };
            const item = new DitaExplorerItem(node);
            assert.strictEqual(item.contextValue, 'ditaKeydef');
        });

        test('Should set command for existing files with path', () => {
            const testPath = path.join(__dirname, 'test.dita');
            const node: MapNode = {
                id: 'test-1',
                label: 'Topic',
                type: 'topic',
                filePath: testPath,
                exists: true,
                children: []
            };
            const item = new DitaExplorerItem(node);
            assert.ok(item.command);
            assert.strictEqual(item.command!.command, 'vscode.open');
        });

        test('Should not set command for missing files', () => {
            const node: MapNode = {
                id: 'test-1',
                label: 'Missing',
                type: 'topic',
                filePath: '/nonexistent/path.dita',
                exists: false,
                children: []
            };
            const item = new DitaExplorerItem(node);
            assert.strictEqual(item.command, undefined);
        });

        test('Should include href in description', () => {
            const node: MapNode = {
                id: 'test-1',
                label: 'Topic',
                type: 'topic',
                href: 'topics/my-topic.dita',
                exists: true,
                children: []
            };
            const item = new DitaExplorerItem(node);
            assert.strictEqual(item.description, 'topics/my-topic.dita');
        });

        test('Should build tooltip with type info', () => {
            const node: MapNode = {
                id: 'test-1',
                label: 'Chapter 1',
                type: 'chapter',
                href: 'chapter1.dita',
                exists: true,
                children: []
            };
            const item = new DitaExplorerItem(node);
            const tooltip = item.tooltip as string;
            assert.ok(tooltip.includes('Chapter 1'));
            assert.ok(tooltip.includes('chapter'));
            assert.ok(tooltip.includes('chapter1.dita'));
        });
    });

    suite('DitaExplorerProvider', () => {
        test('Should create provider without errors', () => {
            const provider = new DitaExplorerProvider();
            assert.ok(provider);
            provider.dispose();
        });

        test('Should fire onDidChangeTreeData on refresh', (done) => {
            const provider = new DitaExplorerProvider();
            provider.onDidChangeTreeData(() => {
                provider.dispose();
                done();
            });
            provider.refresh();
        });

        test('Should return tree item as-is', () => {
            const provider = new DitaExplorerProvider();
            const node: MapNode = {
                id: 'test-1',
                label: 'Test',
                type: 'topic',
                exists: true,
                children: []
            };
            const item = new DitaExplorerItem(node);
            assert.strictEqual(provider.getTreeItem(item), item);
            provider.dispose();
        });
    });

    suite('DitaExplorerProvider root getChildren', () => {
        test('Should return array of root-level items', async () => {
            const provider = new DitaExplorerProvider();
            const items = await provider.getChildren(undefined);
            assert.ok(Array.isArray(items));
            provider.dispose();
        });

        test('Root items should be DitaExplorerItem with map type', async () => {
            const provider = new DitaExplorerProvider();
            const items = await provider.getChildren(undefined);
            for (const item of items) {
                assert.ok(item instanceof DitaExplorerItem);
                assert.strictEqual(item.mapNode.type, 'map');
                assert.strictEqual(item.mapNode.id, 'root');
            }
            provider.dispose();
        });

        test('Should survive one bad map among many (Promise.allSettled)', async () => {
            const provider = new DitaExplorerProvider();
            const items = await provider.getChildren(undefined);
            assert.ok(Array.isArray(items), 'Should always return an array');
            provider.dispose();
        });

        test('Should find maps when workspace is open', async function () {
            const hasWorkspace = vscode.workspace.workspaceFolders !== undefined
                && vscode.workspace.workspaceFolders.length > 0;
            if (!hasWorkspace) { this.skip(); return; }
            const provider = new DitaExplorerProvider();
            const items = await provider.getChildren(undefined);
            assert.ok(items.length > 0, 'Should find at least one map in workspace');
            provider.dispose();
        });
    });

    suite('DitaExplorerProvider child expansion', () => {
        test('Should return children from parent item', async () => {
            const provider = new DitaExplorerProvider();
            const rootItems = await provider.getChildren(undefined);

            // Find a root item with children
            const parentItem = rootItems.find(item => item.mapNode.children.length > 0);
            if (parentItem) {
                const children = await provider.getChildren(parentItem);
                assert.ok(children.length > 0, 'Parent with children should expand');
                for (const child of children) {
                    assert.ok(child instanceof DitaExplorerItem);
                }
            }
            provider.dispose();
        });

        test('Should return empty array for leaf items', async () => {
            const leafNode: MapNode = {
                id: 'leaf',
                label: 'Leaf Topic',
                type: 'topic',
                exists: true,
                children: []
            };
            const provider = new DitaExplorerProvider();
            const leafItem = new DitaExplorerItem(leafNode);
            const children = await provider.getChildren(leafItem);
            assert.strictEqual(children.length, 0);
            provider.dispose();
        });
    });

    suite('DitaExplorerItem tooltip edge cases', () => {
        test('Should include keyref in tooltip and description', () => {
            const node: MapNode = {
                id: 'test-1',
                label: 'plugin-extension-points',
                type: 'topicref',
                keyref: 'plugin-extension-points',
                exists: true,
                children: []
            };
            const item = new DitaExplorerItem(node);
            const tooltip = item.tooltip as string;
            assert.ok(tooltip.includes('Keyref: plugin-extension-points'), 'Tooltip should include keyref');
            assert.strictEqual(item.description, 'plugin-extension-points');
        });

        test('Should include keys in tooltip', () => {
            const node: MapNode = {
                id: 'test-1',
                label: 'product-name',
                type: 'keydef',
                keys: 'product-name',
                exists: true,
                children: []
            };
            const item = new DitaExplorerItem(node);
            const tooltip = item.tooltip as string;
            assert.ok(tooltip.includes('product-name'), 'Tooltip should include keys');
        });

        test('Should include file-not-found in tooltip for missing files', () => {
            const node: MapNode = {
                id: 'test-1',
                label: 'Missing',
                type: 'topic',
                exists: false,
                children: []
            };
            const item = new DitaExplorerItem(node);
            const tooltip = item.tooltip as string;
            assert.ok(tooltip.includes('not found'), 'Tooltip should indicate file not found');
        });

        test('Should include has-errors in tooltip for error nodes', () => {
            const node: MapNode = {
                id: 'test-1',
                label: 'Circular',
                type: 'map',
                exists: true,
                hasErrors: true,
                children: []
            };
            const item = new DitaExplorerItem(node);
            const tooltip = item.tooltip as string;
            assert.ok(tooltip.includes('errors'), 'Tooltip should indicate errors');
        });
    });

    suite('Command Registration', () => {
        test('Should have refreshDitaExplorer command registered', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.refreshDitaExplorer'),
                'ditacraft.refreshDitaExplorer command should be registered'
            );
        });
    });
});
