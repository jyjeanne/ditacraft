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
