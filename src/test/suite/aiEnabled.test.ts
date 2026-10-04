/**
 * `ditacraft.ai.enabled` off: every AI feature stays silent and no LLM request is made.
 * The orchestrator here is a stub that fails the test if it is called.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { AICompletionProvider } from '../../providers/aiCompletionProvider';
import { executeAiQuickFix } from '../../providers/aiQuickFixProvider';
import { handleRequest } from '../../chat/ditacraftParticipant';
import { restructureMapCommand } from '../../commands/restructureMapCommand';
import { LLMRouterService } from '../../llm/llmRouterService';
import { AI_DISABLED_MESSAGE, isAiEnabled } from '../../llm/aiEnabled';
import type { AIServiceOrchestrator } from '../../llm/aiServiceOrchestrator';
import type { DitaCraftLLMConfig, ILLMProvider } from '../../llm/types';

suite('DITA Craft AI Enabled Setting Test Suite', () => {
    let sandbox: sinon.SinonSandbox;
    let infoStub: sinon.SinonStub;
    const orchestratorCalls: string[] = [];
    const orchestrator = new Proxy({}, {
        get: (_target, name) => () => { orchestratorCalls.push(String(name)); throw new Error(`orchestrator.${String(name)} called`); },
    }) as AIServiceOrchestrator;
    const token = new vscode.CancellationTokenSource().token;

    async function setEnabled(value: boolean | undefined): Promise<void> {
        await vscode.workspace.getConfiguration('ditacraft.ai').update('enabled', value, vscode.ConfigurationTarget.Global);
    }

    // Turned off once for the suite: turning it back on makes the running extension initialize its
    // own router, whose notifications would reach the stubs below.
    suiteSetup(async () => { await setEnabled(false); });
    suiteTeardown(async () => { await setEnabled(undefined); });

    setup(() => {
        sandbox = sinon.createSandbox();
        infoStub = sandbox.stub(vscode.window, 'showInformationMessage').resolves(undefined);
        orchestratorCalls.length = 0;
    });

    teardown(() => { sandbox.restore(); });

    test('no AI completions', async () => {
        const document = await vscode.workspace.openTextDocument({ language: 'dita', content: '<topic id="t"><title>T</title><body><p></p></body></topic>' });
        const items = await new AICompletionProvider(orchestrator).provideCompletionItems(
            document, new vscode.Position(0, 44), token, { triggerKind: vscode.CompletionTriggerKind.Invoke, triggerCharacter: undefined });
        assert.strictEqual(items, null);
        assert.deepStrictEqual(orchestratorCalls, []);
    });

    test('the @ditacraft participant answers that AI is turned off, with a button to the setting', async () => {
        const markdown: string[] = [];
        const buttons: vscode.Command[] = [];
        const response = {
            markdown: (value: string | vscode.MarkdownString) => { markdown.push(typeof value === 'string' ? value : value.value); },
            button: (command: vscode.Command) => { buttons.push(command); },
        } as unknown as vscode.ChatResponseStream;
        for (const command of [undefined, 'restructure', 'validate', 'explain', 'suggest-reuse']) {
            markdown.length = 0;
            buttons.length = 0;
            const request = { command, prompt: 'Group topics by audience' } as unknown as vscode.ChatRequest;
            await handleRequest(request, response, token, orchestrator, {} as vscode.ExtensionContext);
            assert.deepStrictEqual(markdown, ['DITA Craft AI is turned off. Turn on the `ditacraft.ai.enabled` setting to use it.'], String(command));
            assert.deepStrictEqual(buttons.map(b => [b.command, b.arguments]), [['workbench.action.openSettings', ['ditacraft.ai.enabled']]]);
        }
        assert.deepStrictEqual(orchestratorCalls, []);
    });

    test('Restructure Map and the AI quick fix say that AI is turned off', async () => {
        await restructureMapCommand(orchestrator, vscode.Uri.file('/project/guide.ditamap'));
        const diagnostic = new vscode.Diagnostic(new vscode.Range(0, 0, 0, 5), 'problem');
        await executeAiQuickFix(orchestrator, vscode.Uri.file('/project/topic.dita'), diagnostic);
        assert.deepStrictEqual(infoStub.getCalls().map(c => c.args), [
            [AI_DISABLED_MESSAGE, 'Open Setting'],
            [AI_DISABLED_MESSAGE, 'Open Setting'],
        ]);
        assert.deepStrictEqual(orchestratorCalls, []);
    });

    // Last: it turns AI back on.
    test('the router: no active provider while AI is turned off, and a quiet initialization shows nothing', async () => {
        assert.strictEqual(isAiEnabled(), false);
        const warningStub = sandbox.stub(vscode.window, 'showWarningMessage').resolves(undefined);
        const errorStub = sandbox.stub(vscode.window, 'showErrorMessage').resolves(undefined);
        const router = new LLMRouterService();
        assert.strictEqual(router.initialized, false);
        // local-only without Ollama: no provider at all, and a configuration conflict
        const config: DitaCraftLLMConfig = { mode: 'local-only', ollamaEnabled: false } as DitaCraftLLMConfig;
        await router.initialize(config, { quiet: true });
        assert.strictEqual(router.initialized, true);
        assert.strictEqual(warningStub.callCount + errorStub.callCount, 0, 'quiet');
        await router.initialize(config);
        assert.strictEqual(warningStub.callCount, 1, 'the "no provider" warning');
        assert.strictEqual(errorStub.callCount, 1, 'the configuration conflict');

        const provider = { id: 'anthropic', isAvailable: () => Promise.resolve(true) } as unknown as ILLMProvider;
        (router as unknown as { _activeProvider: ILLMProvider })._activeProvider = provider;
        assert.strictEqual(router.activeProvider, null, 'AI turned off');
        await setEnabled(undefined);
        assert.strictEqual(isAiEnabled(), true, 'on by default');
        assert.strictEqual(router.activeProvider, provider, 'AI turned on');
    });
});
