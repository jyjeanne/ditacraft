/**
 * Manage DITA-OT Plugins Command Test Suite
 * The command's dialogs, with the DITA-OT CLI and VS Code's UI stubbed.
 */

import * as assert from 'assert';
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
