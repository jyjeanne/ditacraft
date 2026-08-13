/**
 * Publishing Profiles Test Suite
 * Tests the publishing-profiles command registration and pure read/resolve
 * helpers. Config *writes* (rememberLastUsedProfile, profile add/edit/delete)
 * aren't exercised here — this test environment runs with no workspace
 * folder open (see the same "single-file mode" note in
 * securityAndEdgeCases.test.ts), and ConfigurationTarget.Workspace writes
 * need one.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import {
    getPublishingProfiles,
    getLastUsedProfileName,
    resolveDitavalPath,
} from '../../commands/publishProfilesCommand';

suite('Publishing Profiles Test Suite', () => {
    suiteSetup(async () => {
        const extension = vscode.extensions.getExtension('JeremyJeanne.ditacraft');
        if (!extension) {
            throw new Error('Extension not found');
        }
        if (!extension.isActive) {
            await extension.activate();
        }
    });

    suite('Command Registration', () => {
        test('Should have managePublishingProfiles command registered', async () => {
            const commands = await vscode.commands.getCommands(true);
            assert.ok(
                commands.includes('ditacraft.managePublishingProfiles'),
                'ditacraft.managePublishingProfiles command should be registered'
            );
        });
    });

    suite('getPublishingProfiles', () => {
        test('Should default to an empty array when unset', () => {
            const profiles = getPublishingProfiles();
            assert.ok(Array.isArray(profiles), 'should return an array');
            assert.strictEqual(profiles.length, 0, 'should be empty by default');
        });
    });

    suite('getLastUsedProfileName', () => {
        test('Should return undefined when unset', () => {
            const name = getLastUsedProfileName();
            assert.strictEqual(name, undefined, 'should be undefined by default (empty-string setting)');
        });
    });

    suite('resolveDitavalPath', () => {
        test('Should return undefined for an undefined path', () => {
            assert.strictEqual(resolveDitavalPath(undefined), undefined);
        });

        test('Should return an absolute path unchanged', () => {
            const absolute = process.platform === 'win32'
                ? 'C:\\filters\\exclude.ditaval'
                : '/filters/exclude.ditaval';
            assert.strictEqual(resolveDitavalPath(absolute), absolute);
        });

        test('Should resolve a relative path against the first workspace folder, or return undefined with none open', () => {
            // Adapts to whichever state this suite happens to run in rather than
            // assuming one — other DitaCraft tests note this environment typically
            // has no workspace folder open (single-file mode, see
            // securityAndEdgeCases.test.ts), in which case there's nothing to
            // resolve a relative path against and undefined is the correct,
            // safe outcome (not throwing, not silently resolving against cwd).
            const resolved = resolveDitavalPath('filters/exclude.ditaval');
            const folder = vscode.workspace.workspaceFolders?.[0];

            if (folder) {
                assert.strictEqual(resolved, path.join(folder.uri.fsPath, 'filters', 'exclude.ditaval'));
            } else {
                assert.strictEqual(resolved, undefined);
            }
        });
    });
});
