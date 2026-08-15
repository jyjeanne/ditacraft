/**
 * Inline Conref Command Test Suite (§6.1)
 * The command's actual work (resolving/splicing conref content) lives
 * entirely server-side (server/test/inlineConref.test.ts) — this suite only
 * covers command registration and the client-side guard clauses that don't
 * require a live language server (no active editor, non-DITA active file).
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { inlineConrefCommand } from '../../commands/inlineConrefCommand';

suite('Inline Conref Command Test Suite', () => {
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
    });

    suite('Command Registration', () => {
        test('Should have inlineConref command registered', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(commands.includes('ditacraft.inlineConref'), 'ditacraft.inlineConref command should be registered');
        });
    });

    suite('Guard Clauses', () => {
        test('Should not throw when there is no active editor', async () => {
            await vscode.commands.executeCommand('workbench.action.closeAllEditors');
            await assert.doesNotReject(() => inlineConrefCommand());
        });
    });
});
