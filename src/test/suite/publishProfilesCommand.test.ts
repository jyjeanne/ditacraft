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
import * as sinon from 'sinon';
import {
    getPublishingProfiles,
    getLastUsedProfileName,
    resolveDitavalPath,
    resolveProfileOutputDir,
    storeDitavalPath,
    describeProfile,
    promptForDitaval,
    pickTranstype,
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

    suite('resolveProfileOutputDir', () => {
        test('Should return undefined for an undefined or empty outputDir', () => {
            assert.strictEqual(resolveProfileOutputDir(undefined), undefined);
            assert.strictEqual(resolveProfileOutputDir(''), undefined);
        });

        test('Should return a value with no placeholder unchanged', () => {
            const plain = process.platform === 'win32' ? 'C:\\out\\pdf' : '/out/pdf';
            assert.strictEqual(resolveProfileOutputDir(plain), plain);
        });

        test('Should substitute ${workspaceFolder} the same way DitaOtWrapper does (regression)', () => {
            // Without this substitution, a profile's outputDir bypasses
            // DitaOtWrapper.loadConfiguration() entirely (it's threaded through
            // executePublish's overrides, not getOutputDirectory()) and a
            // literal `${workspaceFolder}/out` value would publish into a
            // directory literally named `${workspaceFolder}`.
            const folder = vscode.workspace.workspaceFolders?.[0];
            const resolved = resolveProfileOutputDir('${workspaceFolder}/build');
            const expectedBase = folder ? folder.uri.fsPath : '';

            assert.strictEqual(resolved, `${expectedBase}/build`);
        });
    });

    suite('storeDitavalPath', () => {
        function fakeFolder(fsPath: string, index: number): vscode.WorkspaceFolder {
            return { uri: vscode.Uri.file(fsPath), name: `folder${index}`, index };
        }

        test('Should return the absolute path when no workspace folders are open', () => {
            const picked = vscode.Uri.file(path.join(path.sep, 'anywhere', 'exclude.ditaval'));
            assert.strictEqual(storeDitavalPath(picked, undefined), picked.fsPath);
        });

        test('Should store a path relative to the first workspace folder when the file is under it', () => {
            const root = path.join(path.sep, 'workspace', 'root');
            const folders = [fakeFolder(root, 0)];
            const picked = vscode.Uri.file(path.join(root, 'filters', 'exclude.ditaval'));

            assert.strictEqual(
                storeDitavalPath(picked, folders),
                path.join('filters', 'exclude.ditaval')
            );
        });

        test('Should fall back to an absolute path when the file is under a DIFFERENT root than folder[0] (multi-root regression)', () => {
            // resolveDitavalPath() always re-joins a relative value against
            // workspaceFolders[0] only, so a relative path computed against
            // some other folder (as vscode.workspace.asRelativePath would
            // produce) would resolve to the wrong file. storeDitavalPath must
            // fall back to an absolute path in that case instead.
            const root0 = path.join(path.sep, 'workspace', 'root0');
            const root1 = path.join(path.sep, 'workspace', 'root1');
            const folders = [fakeFolder(root0, 0), fakeFolder(root1, 1)];
            const picked = vscode.Uri.file(path.join(root1, 'exclude.ditaval'));

            assert.strictEqual(storeDitavalPath(picked, folders), picked.fsPath);
        });
    });

    suite('describeProfile', () => {
        test('Should describe a bare profile by transtype only', () => {
            assert.strictEqual(describeProfile({ name: 'p', transtype: 'html5' }), 'html5');
        });

        test('Should include outputDir and ditavalPath when set', () => {
            const description = describeProfile({
                name: 'p',
                transtype: 'pdf',
                outputDir: 'out/pdf',
                ditavalPath: 'filters/exclude.ditaval'
            });
            assert.ok(description.includes('pdf'));
            assert.ok(description.includes('out/pdf'));
            assert.ok(description.includes('filters/exclude.ditaval'));
        });
    });

    suite('promptForDitaval', () => {
        let sandbox: sinon.SinonSandbox;
        let showQuickPickStub: sinon.SinonStub;
        let showOpenDialogStub: sinon.SinonStub;

        setup(() => {
            sandbox = sinon.createSandbox();
            showQuickPickStub = sandbox.stub(vscode.window, 'showQuickPick');
            showOpenDialogStub = sandbox.stub(vscode.window, 'showOpenDialog');
        });

        teardown(() => {
            sandbox.restore();
        });

        test('Should return an empty string when "No filter" is chosen', async () => {
            showQuickPickStub.resolves({ label: '$(circle-slash) No filter', value: '' });
            assert.strictEqual(await promptForDitaval(), '');
            assert.strictEqual(showOpenDialogStub.called, false);
        });

        test('Should return undefined when the filter-choice picker is cancelled (escape)', async () => {
            showQuickPickStub.resolves(undefined);
            assert.strictEqual(await promptForDitaval('existing.ditaval'), undefined);
        });

        test('Should re-show the filter choice rather than clearing an existing filter when the file dialog is cancelled (regression)', async () => {
            // First loop iteration: "Browse..." is picked, then the native
            // file dialog is cancelled. Must NOT short-circuit to '' (which
            // would silently wipe an existing filter) -- it should loop back
            // to the filter-choice picker, where this test then picks
            // "No filter" explicitly on the second iteration.
            showQuickPickStub.onCall(0).resolves({ label: '$(folder-opened) Browse for .ditaval file...', value: 'browse' });
            showQuickPickStub.onCall(1).resolves({ label: '$(circle-slash) No filter', value: '' });
            showOpenDialogStub.resolves(undefined);

            const result = await promptForDitaval('existing.ditaval');

            assert.strictEqual(result, '');
            assert.strictEqual(showQuickPickStub.callCount, 2, 'the filter-choice picker should reappear after a cancelled browse');
        });

        test('Should derive a stored path from the picked file when browsing succeeds', async () => {
            showQuickPickStub.resolves({ label: '$(folder-opened) Browse for .ditaval file...', value: 'browse' });
            const folder = vscode.workspace.workspaceFolders?.[0];
            const pickedPath = folder
                ? path.join(folder.uri.fsPath, 'filters', 'exclude.ditaval')
                : path.join(path.sep, 'somewhere', 'exclude.ditaval');
            const picked = vscode.Uri.file(pickedPath);
            showOpenDialogStub.resolves([picked]);

            const result = await promptForDitaval();

            const expected = folder ? path.join('filters', 'exclude.ditaval') : picked.fsPath;
            assert.strictEqual(result, expected);
        });
    });

    suite('pickTranstype', () => {
        let sandbox: sinon.SinonSandbox;

        setup(() => {
            sandbox = sinon.createSandbox();
        });

        teardown(() => {
            sandbox.restore();
        });

        test('Should offer a transtype list to choose from (falls back to the static list without DITA-OT configured)', async () => {
            const showQuickPickStub = sandbox.stub(vscode.window, 'showQuickPick').resolves('pdf' as unknown as vscode.QuickPickItem);
            const result = await pickTranstype();

            assert.strictEqual(result, 'pdf');
            assert.ok(showQuickPickStub.calledOnce);
            const offeredTranstypes = showQuickPickStub.firstCall.args[0] as unknown as string[];
            assert.ok(Array.isArray(offeredTranstypes) && offeredTranstypes.length > 0);
        });
    });
});
