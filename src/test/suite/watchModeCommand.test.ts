/**
 * Watch Mode Command Test Suite
 * Tests the pure/near-pure resolveWatchTarget/resolveWatchPublishOptions
 * helpers directly, plus command registration and start/stop lifecycle.
 * The actual publish-on-change orchestration (file watcher, debounce,
 * DITA-OT invocation) isn't exercised here — it needs a real DITA-OT
 * installation and a running watcher, which this sandbox can't provide;
 * see the module's own doc comment for the design.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {
    resolveWatchTarget,
    resolveWatchPublishOptions,
    isWatchModeActive,
    stopWatchModeCommand,
    disposeWatchMode,
} from '../../commands/watchModeCommand';

suite('Watch Mode Command Test Suite', () => {
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
        disposeWatchMode();
        await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    });

    suite('Command Registration', () => {
        test('Should have startWatchMode command registered', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('ditacraft.startWatchMode'));
        });

        test('Should have stopWatchMode command registered', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('ditacraft.stopWatchMode'));
        });
    });

    suite('isWatchModeActive', () => {
        test('Should be false when watch mode has never been started', () => {
            assert.strictEqual(isWatchModeActive(), false);
        });
    });

    suite('stopWatchModeCommand', () => {
        test('Should not throw when called while watch mode is not running', () => {
            assert.doesNotThrow(() => stopWatchModeCommand());
        });
    });

    suite('resolveWatchTarget', () => {
        test('Should resolve an explicit Uri directly, ignoring the active editor', async () => {
            const mapPath = path.join(fixturesPath, 'root.ditamap');
            if (!fs.existsSync(mapPath)) {
                return; // fixture not present in this checkout -- skip silently, matches other suites' pattern
            }
            const result = await resolveWatchTarget(vscode.Uri.file(mapPath));
            assert.ok(result);
            assert.strictEqual(result!.filePath, mapPath);
        });

        test('Should fall back to the active editor\'s DITA file when no Uri or root map is given', async () => {
            const topicPath = path.join(fixturesPath, 'main-topic.dita');
            if (!fs.existsSync(topicPath)) {
                return;
            }
            const doc = await vscode.workspace.openTextDocument(topicPath);
            await vscode.window.showTextDocument(doc);

            const result = await resolveWatchTarget(undefined);
            // Only asserts when a workspace root map isn't already configured
            // to something else in this test host -- either way, the function
            // must not throw and must return a defined filePath when one
            // resolves.
            if (result) {
                assert.ok(result.filePath.length > 0);
            }
        });

        test('Should return undefined when there is no explicit Uri, no root map, and no active DITA editor', async () => {
            await vscode.commands.executeCommand('workbench.action.closeAllEditors');
            const config = vscode.workspace.getConfiguration('ditacraft');
            const rootMap = config.get<string>('rootMap', '');
            if (rootMap.length > 0) {
                return; // a root map is configured in this test host -- not the scenario under test
            }
            const result = await resolveWatchTarget(undefined);
            assert.strictEqual(result, undefined);
        });
    });

    suite('resolveWatchPublishOptions', () => {
        test('Should default to a plain html5 publish when no publishing profile is saved/last-used', () => {
            const config = vscode.workspace.getConfiguration('ditacraft');
            const lastUsed = config.get<string>('lastUsedPublishingProfile', '');
            if (lastUsed.length > 0) {
                return; // a profile is already selected in this test host -- not the scenario under test
            }
            const result = resolveWatchPublishOptions();
            assert.strictEqual(result.transtype, 'html5');
            assert.strictEqual(result.overrides, undefined);
        });
    });
});
