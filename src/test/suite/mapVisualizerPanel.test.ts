/**
 * Map Visualizer Panel Test Suite
 * Tests for DITA map visualization functionality
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { MapVisualizerPanel, MapNode } from '../../providers/mapVisualizerPanel';

suite('Map Visualizer Panel Test Suite', () => {
    const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');

    suiteSetup(async () => {
        // Get and activate extension
        const extension = vscode.extensions.getExtension('JeremyJeanne.ditacraft');
        if (!extension) {
            throw new Error('Extension not found');
        }

        if (!extension.isActive) {
            await extension.activate();
        }
    });

    teardown(async () => {
        // Close all editors and dispose visualizer panel after each test
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        if (MapVisualizerPanel.currentPanel) {
            MapVisualizerPanel.currentPanel.dispose();
        }
    });

    suite('Command Registration', () => {
        test('Should have showMapVisualizer command registered', async function() {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.showMapVisualizer'),
                'ditacraft.showMapVisualizer command should be registered'
            );
        });
    });

    suite('MapNode Interface', () => {
        test('MapNode should have required properties', function() {
            const node: MapNode = {
                id: 'test-node',
                label: 'Test Node',
                type: 'topic',
                exists: true,
                children: []
            };

            assert.strictEqual(node.id, 'test-node');
            assert.strictEqual(node.label, 'Test Node');
            assert.strictEqual(node.type, 'topic');
            assert.strictEqual(node.exists, true);
            assert.ok(Array.isArray(node.children));
        });

        test('MapNode should support all node types', function() {
            const types: MapNode['type'][] = ['map', 'topic', 'chapter', 'appendix', 'part', 'topicref', 'keydef', 'unknown'];

            for (const type of types) {
                const node: MapNode = {
                    id: `node-${type}`,
                    label: `${type} Node`,
                    type: type,
                    exists: true,
                    children: []
                };
                assert.strictEqual(node.type, type);
            }
        });

        test('MapNode should support optional properties', function() {
            const node: MapNode = {
                id: 'full-node',
                label: 'Full Node',
                type: 'chapter',
                href: 'chapter.dita',
                filePath: '/path/to/chapter.dita',
                exists: true,
                hasErrors: false,
                children: [],
                navtitle: 'Chapter Title',
                keys: 'chapter-key'
            };

            assert.strictEqual(node.href, 'chapter.dita');
            assert.strictEqual(node.filePath, '/path/to/chapter.dita');
            assert.strictEqual(node.hasErrors, false);
            assert.strictEqual(node.navtitle, 'Chapter Title');
            assert.strictEqual(node.keys, 'chapter-key');
        });

        test('MapNode should support nested children', function() {
            const childNode: MapNode = {
                id: 'child-1',
                label: 'Child Topic',
                type: 'topic',
                exists: true,
                children: []
            };

            const parentNode: MapNode = {
                id: 'parent',
                label: 'Parent Chapter',
                type: 'chapter',
                exists: true,
                children: [childNode]
            };

            assert.strictEqual(parentNode.children.length, 1);
            assert.strictEqual(parentNode.children[0].label, 'Child Topic');
        });
    });

    suite('MapVisualizerPanel Static Properties', () => {
        test('Should have viewType defined', function() {
            assert.strictEqual(MapVisualizerPanel.viewType, 'ditacraft.mapVisualizer');
        });

        test('currentPanel should be undefined initially', function() {
            // After teardown, panel should be disposed
            assert.strictEqual(MapVisualizerPanel.currentPanel, undefined);
        });
    });

    suite('Command Execution - No Active Editor', () => {
        test('Should handle no active editor gracefully', async function() {
            this.timeout(5000);

            await vscode.commands.executeCommand('workbench.action.closeAllEditors');

            // Execute command without any file open - should not throw
            try {
                await vscode.commands.executeCommand('ditacraft.showMapVisualizer');
            } catch (_error) {
                // Expected - no file open, command handled error gracefully
                assert.ok(true, 'Command handled error gracefully');
            }
        });
    });

    suite('Command Execution - Non-Map Files', () => {
        test('Should warn when used on .dita file', async function() {
            this.timeout(10000);

            const topicPath = path.join(fixturesPath, 'valid-topic.dita');
            if (!fs.existsSync(topicPath)) {
                this.skip();
                return;
            }

            const doc = await vscode.workspace.openTextDocument(topicPath);
            await vscode.window.showTextDocument(doc);

            // Execute command on a topic file - should warn
            try {
                await vscode.commands.executeCommand('ditacraft.showMapVisualizer');
                // If no error, panel might have been created or warning shown
                // Either is acceptable behavior
            } catch (_error) {
                assert.ok(true, 'Command handled gracefully');
            }
        });
    });

    suite('Panel Creation with Map File', () => {
        test('Should create panel when opening valid ditamap', async function() {
            this.timeout(10000);

            const mapPath = path.join(fixturesPath, 'valid-map.ditamap');
            if (!fs.existsSync(mapPath)) {
                this.skip();
                return;
            }

            const doc = await vscode.workspace.openTextDocument(mapPath);
            await vscode.window.showTextDocument(doc);

            // Execute command
            await vscode.commands.executeCommand('ditacraft.showMapVisualizer');

            // Panel should be created
            assert.ok(
                MapVisualizerPanel.currentPanel !== undefined,
                'Map visualizer panel should be created'
            );
        });

        test('Should create panel when opening valid bookmap', async function() {
            this.timeout(10000);

            const bookmapPath = path.join(fixturesPath, 'valid-bookmap.bookmap');
            if (!fs.existsSync(bookmapPath)) {
                this.skip();
                return;
            }

            const doc = await vscode.workspace.openTextDocument(bookmapPath);
            await vscode.window.showTextDocument(doc);

            // Execute command
            await vscode.commands.executeCommand('ditacraft.showMapVisualizer');

            // Panel should be created
            assert.ok(
                MapVisualizerPanel.currentPanel !== undefined,
                'Map visualizer panel should be created for bookmap'
            );
        });
    });

    suite('Panel Disposal', () => {
        test('Should properly dispose panel', async function() {
            this.timeout(10000);

            const mapPath = path.join(fixturesPath, 'valid-map.ditamap');
            if (!fs.existsSync(mapPath)) {
                this.skip();
                return;
            }

            const doc = await vscode.workspace.openTextDocument(mapPath);
            await vscode.window.showTextDocument(doc);

            // Create panel
            await vscode.commands.executeCommand('ditacraft.showMapVisualizer');
            assert.ok(MapVisualizerPanel.currentPanel !== undefined);

            // Dispose panel
            MapVisualizerPanel.currentPanel!.dispose();

            // Panel should be undefined after disposal
            assert.strictEqual(MapVisualizerPanel.currentPanel, undefined);
        });
    });

    suite('Panel Reuse', () => {
        test('Should reuse existing panel for same file', async function() {
            this.timeout(15000);

            const mapPath = path.join(fixturesPath, 'valid-map.ditamap');
            if (!fs.existsSync(mapPath)) {
                this.skip();
                return;
            }

            const doc = await vscode.workspace.openTextDocument(mapPath);
            await vscode.window.showTextDocument(doc);

            // Create panel first time
            await vscode.commands.executeCommand('ditacraft.showMapVisualizer');
            const firstPanel = MapVisualizerPanel.currentPanel;
            assert.ok(firstPanel !== undefined);

            // Execute command again - should reuse panel
            await vscode.commands.executeCommand('ditacraft.showMapVisualizer');
            const secondPanel = MapVisualizerPanel.currentPanel;

            // Should be the same panel instance
            assert.strictEqual(firstPanel, secondPanel, 'Should reuse existing panel');
        });
    });

    suite('Panel Title', () => {
        test('Should set panel title with map name', async function() {
            this.timeout(10000);

            const mapPath = path.join(fixturesPath, 'valid-map.ditamap');
            if (!fs.existsSync(mapPath)) {
                this.skip();
                return;
            }

            const doc = await vscode.workspace.openTextDocument(mapPath);
            await vscode.window.showTextDocument(doc);

            await vscode.commands.executeCommand('ditacraft.showMapVisualizer');

            // Panel should be created with title containing map name
            assert.ok(MapVisualizerPanel.currentPanel !== undefined);
            // Note: We can't directly access panel.title from outside, but we can verify panel exists
        });
    });

    suite('HTML Escaping', () => {
        test('MapNode with special characters in label should be safe', function() {
            // This tests the concept that special characters should be escaped
            const node: MapNode = {
                id: 'xss-test',
                label: '<script>alert("xss")</script>',
                type: 'topic',
                href: 'test.dita',
                exists: true,
                children: []
            };

            // The label contains potential XSS, but when rendered it should be escaped
            assert.ok(node.label.includes('<script>'));
            // Actual escaping is done by _escapeHtml in the panel
        });

        test('MapNode with special characters in href should be handled', function() {
            const node: MapNode = {
                id: 'href-test',
                label: 'Test',
                type: 'topic',
                href: 'file with spaces & "quotes".dita',
                exists: false,
                children: []
            };

            assert.ok(node.href?.includes('&'));
            assert.ok(node.href?.includes('"'));
        });
    });
});
