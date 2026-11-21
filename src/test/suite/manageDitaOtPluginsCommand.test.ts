/**
 * Manage DITA-OT Plugins Command Test Suite
 * The command's dialogs, with the DITA-OT CLI and VS Code's UI stubbed.
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { manageDitaOtPluginsCommand } from '../../commands/manageDitaOtPluginsCommand';
import { DitaOtWrapper } from '../../utils/ditaOtWrapper';

suite('Manage DITA-OT Plugins Command Test Suite', () => {
    let sandbox: sinon.SinonSandbox;

    setup(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(DitaOtWrapper.prototype, 'verifyInstallation').resolves({ installed: true, version: '4.3.5', path: 'C:/dita-ot' });
        sandbox.stub(vscode.window, 'withProgress').callsFake(
            (_options, task) => task({ report: () => undefined }, new vscode.CancellationTokenSource().token)
        );
    });

    teardown(() => {
        sandbox.restore();
    });

    function pickList(): sinon.SinonStub {
        const quickPick = sandbox.stub(vscode.window, 'showQuickPick');
        quickPick.onFirstCall().resolves({ label: 'List installed plugins', action: 'list' } as unknown as vscode.QuickPickItem);
        quickPick.onSecondCall().resolves(undefined);
        return quickPick;
    }

    test('lists the installed plugins in a QuickPick, with their versions (regression: the list was hidden)', async () => {
        // `dita plugins` output of DITA-OT 4.3.5, as it prints it on Windows.
        const runDitaCli = sandbox.stub(DitaOtWrapper.prototype, 'runDitaCli').resolves({
            code: 0,
            stdout: 'org.dita.html5@4.3.5\r\ncom.elovirta.pdf@0.8.0\r\norg.dita.base@4.3.5\r\n',
            stderr: '',
            timedOut: false
        });
        const quickPick = pickList();

        await manageDitaOtPluginsCommand();

        assert.deepStrictEqual(runDitaCli.firstCall.args[0], ['plugins']);
        assert.strictEqual(quickPick.callCount, 2, 'the installed plugins are shown in a second QuickPick');
        const items = await quickPick.secondCall.args[0] as vscode.QuickPickItem[];
        assert.deepStrictEqual(
            items.map(item => [item.label, item.description]),
            [['com.elovirta.pdf', '0.8.0'], ['org.dita.base', '4.3.5'], ['org.dita.html5', '4.3.5']]
        );
        const options = quickPick.secondCall.args[1] as vscode.QuickPickOptions;
        assert.strictEqual(options.placeHolder, 'Installed DITA-OT plugins (3)');
    });

    test('says so when no plugin is installed', async () => {
        sandbox.stub(DitaOtWrapper.prototype, 'runDitaCli').resolves({ code: 0, stdout: '\r\n', stderr: '', timedOut: false });
        const quickPick = pickList();
        const info = sandbox.stub(vscode.window, 'showInformationMessage').resolves(undefined);

        await manageDitaOtPluginsCommand();

        assert.strictEqual(quickPick.callCount, 1);
        assert.ok(info.calledWith('No DITA-OT plugins are installed.'));
    });

    suite('Uninstall plugin', () => {
        let root: string;
        let ditaOt: string;
        let calls: string[][];
        let uninstallResult: () => { code: number; stdout: string; stderr: string; timedOut: boolean };

        const pluginFolder = (id: string): string => path.join(ditaOt, 'plugins', id);
        const integrationError = "Error: Integration failed: java.lang.RuntimeException: [DOTJ020W] The 'com.example.child' plug-in cannot be loaded because it requires at least one plug-in in 'PluginRequirement[plugins=[com.example.test], required=true]'.\r\n";

        function writePlugin(id: string, body = ''): void {
            fs.mkdirSync(pluginFolder(id), { recursive: true });
            fs.writeFileSync(path.join(pluginFolder(id), 'plugin.xml'), `<plugin id="${id}" version="1.0.0">${body}</plugin>`);
        }

        /** The action picker answers "Uninstall plugin", then the plugin picker answers `pick`. */
        function pickUninstall(pick?: string): sinon.SinonStub {
            const quickPick = sandbox.stub(vscode.window, 'showQuickPick');
            quickPick.onFirstCall().resolves({ label: 'Uninstall plugin', action: 'uninstall' } as unknown as vscode.QuickPickItem);
            quickPick.onSecondCall().callsFake(async items => (await items as vscode.QuickPickItem[])
                .find(item => item.label === pick && item.kind !== vscode.QuickPickItemKind.Separator));
            return quickPick;
        }

        setup(() => {
            root = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-uninstall-command-'));
            ditaOt = path.join(root, 'dita-ot-4.3.5');
            writePlugin('org.dita.base');
            writePlugin('com.example.test');
            writePlugin('com.example.child', '<require plugin="com.example.test"/>');
            calls = [];
            uninstallResult = () => ({ code: 0, stdout: 'Removed com.example.child\r\n', stderr: '', timedOut: false });
            sandbox.stub(DitaOtWrapper.prototype, 'resolveDitaOtHome').returns(ditaOt);
            // A fake `dita`: `uninstall` deletes the plugin folder first, as DITA-OT 4.3.5 does.
            sandbox.stub(DitaOtWrapper.prototype, 'runDitaCli').callsFake(async args => {
                calls.push(args);
                if (args[0] === 'plugins') {
                    return { code: 0, stdout: 'com.example.child@1.0.0\r\ncom.example.test@1.0.0\r\norg.dita.base@4.3.5\r\n', stderr: '', timedOut: false };
                }
                if (args[0] === 'uninstall') {
                    fs.rmSync(pluginFolder(args[1]), { recursive: true, force: true });
                    return uninstallResult();
                }
                return { code: 0, stdout: '', stderr: '', timedOut: false };
            });
        });

        teardown(() => {
            fs.rmSync(root, { recursive: true, force: true });
        });

        test('offers the removable plugins first, then the others with the reason', async () => {
            const quickPick = pickUninstall(undefined);

            await manageDitaOtPluginsCommand();

            const items = await quickPick.secondCall.args[0] as vscode.QuickPickItem[];
            assert.deepStrictEqual(items.map(item => [item.label, item.kind === vscode.QuickPickItemKind.Separator ? 'separator' : item.detail ?? '']), [
                ['com.example.child', ''],
                ['Cannot be removed here', 'separator'],
                ['com.example.test', 'Required by com.example.child'],
                ['org.dita.base', 'Part of DITA-OT']
            ]);
            assert.strictEqual((quickPick.secondCall.args[1] as vscode.QuickPickOptions).placeHolder,
                'Select a DITA-OT plugin to uninstall (1 of 3 can be removed)');
            assert.deepStrictEqual(calls, [['plugins']]);
        });

        test('names the dependents of a plugin that cannot be removed, and runs nothing', async () => {
            pickUninstall('com.example.test');
            const info = sandbox.stub(vscode.window, 'showInformationMessage').resolves(undefined);

            await manageDitaOtPluginsCommand();

            assert.ok(info.calledWith('com.example.test cannot be removed: com.example.child depends on it. Remove it first.'));
            assert.deepStrictEqual(calls, [['plugins']]);
            assert.ok(fs.existsSync(pluginFolder('com.example.test')));
        });

        test('removes a plugin after confirmation', async () => {
            pickUninstall('com.example.child');
            const warning = sandbox.stub(vscode.window, 'showWarningMessage').resolves('Remove' as unknown as vscode.MessageItem);
            const info = sandbox.stub(vscode.window, 'showInformationMessage').resolves(undefined);

            await manageDitaOtPluginsCommand();

            assert.strictEqual(warning.firstCall.args[0], `Remove DITA-OT plugin com.example.child@1.0.0 from ${ditaOt}?`);
            assert.strictEqual((warning.firstCall.args[1] as vscode.MessageOptions).modal, true);
            assert.deepStrictEqual(calls, [['plugins'], ['uninstall', 'com.example.child']]);
            assert.ok(info.calledWith('DITA-OT plugin com.example.child@1.0.0 removed.'));
            assert.strictEqual(fs.existsSync(pluginFolder('com.example.child')), false);
        });

        test('runs nothing when the confirmation is cancelled', async () => {
            pickUninstall('com.example.child');
            sandbox.stub(vscode.window, 'showWarningMessage').resolves(undefined);

            await manageDitaOtPluginsCommand();

            assert.deepStrictEqual(calls, [['plugins']]);
            assert.ok(fs.existsSync(pluginFolder('com.example.child')));
        });

        test('restores the plugin and says so when DITA-OT fails to integrate without it', async () => {
            // The classification is bypassed by a dependency it does not know, so the integration fails.
            uninstallResult = () => ({ code: 1, stdout: '', stderr: integrationError, timedOut: false });
            pickUninstall('com.example.child');
            sandbox.stub(vscode.window, 'showWarningMessage').resolves('Remove' as unknown as vscode.MessageItem);
            const error = sandbox.stub(vscode.window, 'showErrorMessage').resolves(undefined);

            await manageDitaOtPluginsCommand();

            assert.deepStrictEqual(calls, [['plugins'], ['uninstall', 'com.example.child'], ['install']]);
            assert.match(String(error.firstCall.args[0]),
                /^Could not remove com\.example\.child: Integration failed: \[DOTJ020W\] .*\. The plugin was restored\.$/);
            assert.ok(fs.existsSync(path.join(pluginFolder('com.example.child'), 'plugin.xml')));
        });

        test('asks for the DITA-OT folder when it is not known', async () => {
            (DitaOtWrapper.prototype.resolveDitaOtHome as sinon.SinonStub).returns(undefined);
            pickUninstall('com.example.child');
            const warning = sandbox.stub(vscode.window, 'showWarningMessage').resolves(undefined);

            await manageDitaOtPluginsCommand();

            assert.match(String(warning.firstCall.args[0]), /needs the DITA-OT folder/);
            assert.strictEqual(warning.firstCall.args[1], 'Configure DITA-OT Path');
            assert.deepStrictEqual(calls, []);
        });
    });

    test('reports a failure of the DITA-OT CLI', async () => {
        sandbox.stub(DitaOtWrapper.prototype, 'runDitaCli').resolves({
            code: 1,
            stdout: '',
            stderr: 'Error: JAVA_HOME is not set\r\n',
            timedOut: false
        });
        pickList();
        const error = sandbox.stub(vscode.window, 'showErrorMessage').resolves(undefined);

        await manageDitaOtPluginsCommand();

        assert.ok(error.calledOnce);
        assert.match(String(error.firstCall.args[0]), /'dita plugins' failed: Error: JAVA_HOME is not set/);
    });
});
