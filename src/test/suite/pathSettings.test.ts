/**
 * Path settings following a moved file or folder (src/utils/pathSettings.ts).
 * The resolution and rewriting rules are covered by test/shared/movedPaths.test.ts.
 */

import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';
import { followPathSettings } from '../../utils/pathSettings';

suite('Path Settings Test Suite', () => {
    const config = () => vscode.workspace.getConfiguration('ditacraft');

    suiteSetup(async () => {
        const extension = vscode.extensions.getExtension('JeremyJeanne.ditacraft');
        if (extension && !extension.isActive) {
            await extension.activate();
        }
    });

    teardown(async () => {
        for (const key of ['templatesPath', 'customRulesFile', 'previewCustomCss']) {
            await config().update(key, undefined, vscode.ConfigurationTarget.Global);
        }
    });

    test('Settings naming a moved file — or a file or folder in a moved folder — follow it, in the settings they live in (regression: they kept the old path)', async () => {
        // No workspace folder in this test run: the values are absolute.
        const root = path.join(path.sep, 'docs');
        await config().update('templatesPath', path.join(root, 'templates'), vscode.ConfigurationTarget.Global);
        await config().update('customRulesFile', path.join(root, 'config', 'rules.json'), vscode.ConfigurationTarget.Global);
        await config().update('previewCustomCss', path.join(root, 'style', 'preview.css'), vscode.ConfigurationTarget.Global);

        assert.deepStrictEqual(await followPathSettings([{ oldPath: path.join(root, 'unrelated'), newPath: path.join(root, 'x') }]), []);
        const changed = await followPathSettings([
            { oldPath: path.join(root, 'templates'), newPath: path.join(root, 'house-templates') },
            { oldPath: path.join(root, 'config'), newPath: path.join(root, 'settings') },
        ]);
        assert.deepStrictEqual(changed, ['templatesPath', 'customRulesFile']);
        assert.strictEqual(config().inspect<string>('templatesPath')?.globalValue, path.join(root, 'house-templates'));
        assert.strictEqual(config().inspect<string>('customRulesFile')?.globalValue, path.join(root, 'settings', 'rules.json'));
        assert.strictEqual(config().inspect<string>('previewCustomCss')?.globalValue, path.join(root, 'style', 'preview.css'), 'not moved');
    });
});
