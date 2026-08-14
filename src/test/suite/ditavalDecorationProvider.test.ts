/**
 * Condition Highlighting Registration Test Suite (§4.5 Piece 2)
 *
 * The decoration recompute/debounce logic itself lives in module-private
 * functions in ditavalDecorationProvider.ts and is exercised indirectly —
 * its matching logic is covered directly by ditavalParser.test.ts and
 * xmlElementScanner.test.ts's pure-function tests. This suite verifies the
 * registration surface: the extension activates (which calls
 * registerConditionHighlighting during activation) without throwing, and
 * the setting that gates the feature is correctly declared.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Condition Highlighting Registration Test Suite', () => {
    suiteSetup(async () => {
        const extension = vscode.extensions.getExtension('JeremyJeanne.ditacraft');
        if (!extension) {
            throw new Error('Extension not found');
        }
        if (!extension.isActive) {
            await extension.activate();
        }
    });

    test('Extension should activate successfully with condition highlighting registered', () => {
        const extension = vscode.extensions.getExtension('JeremyJeanne.ditacraft');
        assert.ok(extension?.isActive, 'extension should be active (registerConditionHighlighting ran during activation without throwing)');
    });

    test('conditionHighlightingEnabled configuration should exist', () => {
        const config = vscode.workspace.getConfiguration('ditacraft');
        const enabled = config.get<boolean>('conditionHighlightingEnabled');

        assert.ok(enabled !== undefined, 'conditionHighlightingEnabled should be defined');
        assert.strictEqual(typeof enabled, 'boolean', 'conditionHighlightingEnabled should be boolean');
    });

    test('conditionHighlightingEnabled should default to true', () => {
        const config = vscode.workspace.getConfiguration('ditacraft');
        assert.strictEqual(config.get<boolean>('conditionHighlightingEnabled'), true);
    });
});
