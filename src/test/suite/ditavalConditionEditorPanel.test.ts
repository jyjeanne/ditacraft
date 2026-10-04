/**
 * Visual DITAVAL Condition Editor Panel Test Suite (§5.3)
 * Mirrors `mapVisualizerPanel.test.ts`'s scope: command registration and
 * panel creation/disposal lifecycle. The actual merge/toggle logic that
 * drives what the panel renders is covered directly, without any VS Code
 * API surface, in `ditavalConditionState.test.ts`; serialization is
 * covered in `ditavalParser.test.ts`.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { DitavalConditionEditorPanel } from '../../providers/ditavalConditionEditorPanel';

suite('DITAVAL Condition Editor Panel Test Suite', () => {
    const fixturesPath = path.join(__dirname, '..', '..', '..', 'src', 'test', 'fixtures');

    suiteSetup(async () => {
        const extension = vscode.extensions.getExtension('JeremyJeanne.ditacraft');
        if (!extension) {
            throw new Error('Extension not found');
        }
        if (!extension.isActive) {
            await extension.activate();
        }
    });

    teardown(async () => {
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
        if (DitavalConditionEditorPanel.currentPanel) {
            DitavalConditionEditorPanel.currentPanel.dispose();
        }
    });

    suite('Command Registration', () => {
        test('Should have editDitavalConditions command registered', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.editDitavalConditions'),
                'ditacraft.editDitavalConditions command should be registered'
            );
        });
    });

    suite('DitavalConditionEditorPanel Static Properties', () => {
        test('Should have viewType defined', () => {
            assert.strictEqual(DitavalConditionEditorPanel.viewType, 'ditacraft.ditavalConditionEditor');
        });

        test('currentPanel should be undefined initially', () => {
            assert.strictEqual(DitavalConditionEditorPanel.currentPanel, undefined);
        });
    });

    suite('Command Execution - No Active Editor', () => {
        test('Should handle no active editor gracefully', async function() {
            this.timeout(5000);
            await vscode.commands.executeCommand('workbench.action.closeAllEditors');

            try {
                await vscode.commands.executeCommand('ditacraft.editDitavalConditions');
            } catch (_error) {
                assert.ok(true, 'Command handled error gracefully');
            }
            assert.strictEqual(DitavalConditionEditorPanel.currentPanel, undefined);
        });
    });

    suite('Command Execution - Non-DITAVAL Files', () => {
        test('Should warn and not open a panel for a .dita file', async function() {
            this.timeout(10000);
            const topicPath = path.join(fixturesPath, 'main-topic.dita');
            if (!fs.existsSync(topicPath)) {
                this.skip();
                return;
            }

            const doc = await vscode.workspace.openTextDocument(topicPath);
            await vscode.window.showTextDocument(doc);

            await vscode.commands.executeCommand('ditacraft.editDitavalConditions');
            assert.strictEqual(DitavalConditionEditorPanel.currentPanel, undefined);
        });
    });

    suite('Panel Creation with DITAVAL File', () => {
        test('Should create panel when opening a valid .ditaval file', async function() {
            this.timeout(10000);
            const ditavalPath = path.join(fixturesPath, 'sample.ditaval');
            if (!fs.existsSync(ditavalPath)) {
                this.skip();
                return;
            }

            const doc = await vscode.workspace.openTextDocument(ditavalPath);
            await vscode.window.showTextDocument(doc);

            await vscode.commands.executeCommand('ditacraft.editDitavalConditions');

            assert.ok(
                DitavalConditionEditorPanel.currentPanel !== undefined,
                'DITAVAL condition editor panel should be created'
            );
        });

        test('Should accept a Uri argument directly (context-menu invocation)', async function() {
            this.timeout(10000);
            const ditavalPath = path.join(fixturesPath, 'sample.ditaval');
            if (!fs.existsSync(ditavalPath)) {
                this.skip();
                return;
            }

            DitavalConditionEditorPanel.createOrShow(ditavalPath);
            assert.ok(DitavalConditionEditorPanel.currentPanel !== undefined);
        });

        test('Reusing createOrShow for a second file should reuse the singleton panel', async function() {
            this.timeout(10000);
            const ditavalPath = path.join(fixturesPath, 'sample.ditaval');
            if (!fs.existsSync(ditavalPath)) {
                this.skip();
                return;
            }

            const first = DitavalConditionEditorPanel.createOrShow(ditavalPath);
            const second = DitavalConditionEditorPanel.createOrShow(ditavalPath);
            assert.strictEqual(first, second, 'createOrShow should reuse the singleton panel, not create a second one');
        });

        test('Chips are keyboard-reachable buttons that say their state and next action (regression: plain spans, mouse only)', async function() {
            this.timeout(10000);
            const ditavalPath = path.join(fixturesPath, 'sample.ditaval');
            const panel = DitavalConditionEditorPanel.createOrShow(ditavalPath);
            const html = (): string => (panel as unknown as { _panel: vscode.WebviewPanel })._panel.webview.html;
            for (let i = 0; i < 50 && !html().includes('class="chip"'); i++) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            const page = html();
            assert.ok(!/<span class="chip"/.test(page), 'no span chips');
            assert.ok(
                page.includes('<button type="button" class="chip" data-attr="audience" data-val="internal" data-next-action="include" data-action="exclude"'),
                'the audience=internal chip is a button'
            );
            assert.ok(page.includes('aria-label="audience = internal: exclude. Press to set include."'), 'it says its state and what pressing it does');
            assert.ok(page.includes('aria-label="platform = windows: include. Press to set flag."'));
            assert.ok(/role="group" aria-labelledby="group-0"/.test(page), 'each attribute is a labelled group');
            assert.ok(page.includes('role="status" aria-live="polite"'), 'changes are announced');
            assert.ok(page.includes('aria-label="Value"') && page.includes('aria-label="Attribute"'), 'the add form\'s fields are labelled');
            assert.ok(/addEventListener\('keydown'[\s\S]*?event\.key === 'Enter'/.test(page), 'Enter in the add form adds the condition');
        });
    });

    suite('Panel Disposal', () => {
        test('dispose() should clear currentPanel', async function() {
            this.timeout(10000);
            const ditavalPath = path.join(fixturesPath, 'sample.ditaval');
            if (!fs.existsSync(ditavalPath)) {
                this.skip();
                return;
            }

            DitavalConditionEditorPanel.createOrShow(ditavalPath);
            assert.ok(DitavalConditionEditorPanel.currentPanel !== undefined);

            DitavalConditionEditorPanel.currentPanel!.dispose();
            assert.strictEqual(DitavalConditionEditorPanel.currentPanel, undefined);
        });
    });
});
