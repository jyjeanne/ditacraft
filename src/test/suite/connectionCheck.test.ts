/**
 * The Configure AI panel's Test: real connection checks. The providers' SDKs and fetch talk HTTP to
 * a local server that answers as the Anthropic, OpenAI and Ollama APIs do.
 */

import * as assert from 'assert';
import * as http from 'http';
import type { AddressInfo } from 'net';
import { AnthropicLLMProvider } from '../../llm/providers/anthropicProvider';
import { OpenAILLMProvider, isReasoningModel } from '../../llm/providers/openaiProvider';
import { OllamaLLMProvider } from '../../llm/providers/ollamaProvider';
import { LLMRouterService } from '../../llm/llmRouterService';
import { describeProviders } from '../../commands/configureAICommand';
import type { ConnectionCheck, DitaCraftLLMConfig, ILLMProvider } from '../../llm/types';

const ANTHROPIC_KEY = 'sk-ant-good-0123456789012345678901234567';
const OPENAI_KEY = 'sk-good-0123456789012345';
// A port just freed: connections to it are refused. (Not the discard port 9: fetch blocks it as a "bad port".)
let REFUSED = '';

function json(res: http.ServerResponse, status: number, body: unknown): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
}

suite('Connection Check Test Suite', () => {
    let server: http.Server;
    let base = '';
    const requests: string[] = [];
    /** The bodies of the chat completion requests. */
    const chatBodies: Array<Record<string, unknown>> = [];

    suiteSetup(async () => {
        server = http.createServer((req, res) => {
            const url = req.url ?? '';
            requests.push(`${req.method} ${url}`);
            if (req.method === 'POST' && url === '/v1/chat/completions') {
                // OpenAI's streamed answer: server-sent events, then [DONE]
                let body = '';
                req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
                req.on('end', () => {
                    chatBodies.push(JSON.parse(body) as Record<string, unknown>);
                    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
                    for (const text of ['<p>', 'fixed', '</p>']) {
                        res.write(`data: ${JSON.stringify({ id: 'c', object: 'chat.completion.chunk', created: 1, model: 'm',
                            choices: [{ index: 0, delta: { content: text }, finish_reason: null }] })}\n\n`);
                    }
                    res.end('data: [DONE]\n\n');
                });
                return;
            }
            if (url.startsWith('/slow/')) { return; } // never answers
            if (url.startsWith('/broken/')) { return json(res, 500, { error: { message: 'overloaded' } }); }
            if (url === '/html/api/tags') { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end('<html>a web server</html>'); }
            if (url === '/api/tags') {
                return json(res, 200, { models: [{ name: 'llama3:latest', model: 'llama3:latest' }, { name: 'mistral:7b', model: 'mistral:7b' }] });
            }
            const model = /^\/v1\/models\/([^/?]+)/.exec(url)?.[1];
            if (!model) { return json(res, 404, {}); }
            if (req.headers['x-api-key'] !== undefined) {
                // Anthropic
                if (req.headers['x-api-key'] !== ANTHROPIC_KEY) {
                    return json(res, 401, { type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } });
                }
                return model === 'claude-test'
                    ? json(res, 200, { type: 'model', id: 'claude-test', display_name: 'Claude Test', created_at: '2026-01-01T00:00:00Z' })
                    : json(res, 404, { type: 'error', error: { type: 'not_found_error', message: `model: ${model}` } });
            }
            // OpenAI
            if (req.headers.authorization !== `Bearer ${OPENAI_KEY}`) {
                return json(res, 401, { error: { message: 'Incorrect API key provided', type: 'invalid_request_error', code: 'invalid_api_key' } });
            }
            return model === 'gpt-test'
                ? json(res, 200, { id: 'gpt-test', object: 'model', created: 1, owned_by: 'openai' })
                : json(res, 404, { error: { message: `The model '${model}' does not exist`, type: 'invalid_request_error', code: 'model_not_found' } });
        });
        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
        base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
        const closed = http.createServer();
        await new Promise<void>(resolve => closed.listen(0, '127.0.0.1', resolve));
        REFUSED = `http://127.0.0.1:${(closed.address() as AddressInfo).port}`;
        await new Promise<void>(resolve => closed.close(() => resolve()));
    });

    suiteTeardown(() => {
        server.closeAllConnections();
        server.close();
    });

    const signal = () => new AbortController().signal;
    const anthropic = (key: string, model: string, baseURL = base, checkTimeoutMs?: number) =>
        new AnthropicLLMProvider(key, model, { baseURL, checkTimeoutMs }).checkConnection(signal());
    const openai = (key: string, model: string, baseURL = `${base}/v1`) =>
        new OpenAILLMProvider(key, model, { baseURL }).checkConnection(signal());
    const ollama = (model: string, baseUrl = base, checkTimeoutMs?: number) =>
        new OllamaLLMProvider(baseUrl, model, { checkTimeoutMs }).checkConnection(signal());

    test('Anthropic: the key and the model are checked over HTTP (regression: Test only checked the key\'s format)', async () => {
        requests.length = 0;
        assert.deepStrictEqual(await anthropic(ANTHROPIC_KEY, 'claude-test'),
            { ok: true, detail: 'Connected to Anthropic: the key works and model Claude Test (claude-test) is available.' });
        assert.deepStrictEqual(requests, ['GET /v1/models/claude-test'], 'one model lookup, no message generated');
        assert.deepStrictEqual(await anthropic('sk-ant-wrong-012345678901234567890123456', 'claude-test'),
            { ok: false, detail: 'Anthropic refused the API key (401): check it, or save a new one.' });
        assert.deepStrictEqual(await anthropic(ANTHROPIC_KEY, 'claude-3-5-sonnet-20241022'),
            { ok: false, detail: 'Anthropic has no model "claude-3-5-sonnet-20241022" for this key (404): check the model setting.' });
    });

    test('Anthropic: server errors, refused connections, timeouts, cancellation', async () => {
        const broken = await anthropic(ANTHROPIC_KEY, 'claude-test', `${base}/broken`);
        assert.ok(broken.detail.startsWith('Anthropic answered with an error (500): '), broken.detail);
        assert.strictEqual(broken.ok, false);
        assert.deepStrictEqual(await anthropic(ANTHROPIC_KEY, 'claude-test', REFUSED),
            { ok: false, detail: 'Could not reach Anthropic: the connection was refused (ECONNREFUSED).' });
        assert.deepStrictEqual(await anthropic(ANTHROPIC_KEY, 'claude-test', `${base}/slow`, 300),
            { ok: false, detail: 'No answer from Anthropic within 0.3 s.' });
        const cancelled = new AbortController();
        cancelled.abort();
        assert.deepStrictEqual(await new AnthropicLLMProvider(ANTHROPIC_KEY, 'claude-test', { baseURL: `${base}/slow` }).checkConnection(cancelled.signal),
            { ok: false, detail: 'The check was cancelled.' });
    });

    test('OpenAI: the key and the model are checked over HTTP', async () => {
        assert.deepStrictEqual(await openai(OPENAI_KEY, 'gpt-test'),
            { ok: true, detail: 'Connected to OpenAI: the key works and model gpt-test is available.' });
        assert.deepStrictEqual(await openai('sk-wrong-0123456789012345', 'gpt-test'),
            { ok: false, detail: 'OpenAI refused the API key (401): check it, or save a new one.' });
        assert.deepStrictEqual(await openai(OPENAI_KEY, 'gpt-missing'),
            { ok: false, detail: 'OpenAI has no model "gpt-missing" for this key (404): check the model setting.' });
        assert.deepStrictEqual(await openai(OPENAI_KEY, 'gpt-test', REFUSED),
            { ok: false, detail: 'Could not reach OpenAI: the connection was refused (ECONNREFUSED).' });
    });

    test('OpenAI reasoning models (the default gpt-6.1-sol) get max_completion_tokens with room to reason, low effort, no temperature', async () => {
        const send = async (model: string) => {
            chatBodies.length = 0;
            const chunks: string[] = [];
            await new OpenAILLMProvider(OPENAI_KEY, model, { baseURL: `${base}/v1` })
                .stream({ systemPrompt: 'Fix it.', userMessage: '<p>broken', maxTokens: 256, temperature: 0.1 }, c => chunks.push(c), new AbortController().signal);
            assert.strictEqual(chunks.join(''), '<p>fixed</p>', `${model}: the streamed answer`);
            const { model: sent, max_tokens, max_completion_tokens, temperature, reasoning_effort, stream } = chatBodies[0];
            return { sent, max_tokens, max_completion_tokens, temperature, reasoning_effort, stream };
        };
        // Reasoning models refuse max_tokens and any temperature but the default; their reasoning counts in max_completion_tokens.
        assert.deepStrictEqual(await send('gpt-6.1-sol'), {
            sent: 'gpt-6.1-sol', max_tokens: undefined, max_completion_tokens: 25_256, temperature: undefined, reasoning_effort: 'low', stream: true,
        });
        // An older chat model keeps its temperature.
        assert.deepStrictEqual(await send('gpt-4o'), {
            sent: 'gpt-4o', max_tokens: undefined, max_completion_tokens: 256, temperature: 0.1, reasoning_effort: undefined, stream: true,
        });
    });

    test('isReasoningModel: the o-series, GPT-5 and later, not their -chat variants or older models', () => {
        for (const model of ['gpt-6.1-sol', 'gpt-6-astra', 'gpt-6-luna', 'gpt-5', 'gpt-5.4-nano', 'o3', 'o4-mini', 'gpt-10-x']) {
            assert.strictEqual(isReasoningModel(model), true, model);
        }
        for (const model of ['gpt-4o', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-3.5-turbo', 'gpt-5-chat-latest', 'chatgpt-4o-latest']) {
            assert.strictEqual(isReasoningModel(model), false, model);
        }
    });

    test('Ollama: the server answers and the model is installed', async () => {
        assert.deepStrictEqual(await ollama('llama3'), { ok: true, detail: `Connected to Ollama at ${base}: model llama3 is installed.` }, 'llama3 = llama3:latest');
        assert.deepStrictEqual(await ollama('mistral:7b'), { ok: true, detail: `Connected to Ollama at ${base}: model mistral:7b is installed.` });
        assert.deepStrictEqual(await ollama('mistral'),
            { ok: false, detail: `Ollama at ${base} is running, but model "mistral" is not installed: run "ollama pull mistral".` }, 'mistral = mistral:latest, not installed');
        assert.deepStrictEqual(await ollama('llama3', REFUSED), { ok: false, detail: `Could not reach Ollama at ${REFUSED}: the connection was refused (ECONNREFUSED).` });
        assert.deepStrictEqual(await ollama('llama3', `${base}/html`), { ok: false, detail: `${base}/html answered, but not as an Ollama server.` });
        assert.deepStrictEqual(await ollama('llama3', `${base}/slow`, 300), { ok: false, detail: `No answer from Ollama at ${base}/slow within 0.3 s.` });
    });

    test('router.testProvider: a provider that passes becomes the active one; an active one that fails gives way', async () => {
        const fake = (id: string, check: ConnectionCheck) =>
            ({ id, displayName: id, isAvailable: () => Promise.resolve(true), checkConnection: () => Promise.resolve(check) }) as unknown as ILLMProvider;
        const router = new LLMRouterService();
        const internals = router as unknown as { providers: ILLMProvider[]; _activeProvider: ILLMProvider | null };
        const good = fake('openai', { ok: true, detail: 'fine' });
        const bad = fake('anthropic', { ok: false, detail: 'refused' });
        internals.providers = [bad, good];
        assert.deepStrictEqual(await router.testProvider('anthropic'), { ok: false, detail: 'refused' });
        assert.strictEqual(router.activeProvider, null, 'a failing provider does not become active');
        assert.deepStrictEqual(await router.testProvider('openai'), { ok: true, detail: 'fine' });
        assert.strictEqual(router.activeProvider, good);
        assert.deepStrictEqual(await router.testProvider('ollama'),
            { ok: false, detail: 'Not checked: it has no key, or the AI mode or settings leave it out.' });

        // The active provider (chosen on its key's format) fails its check: the next available one takes over.
        internals._activeProvider = bad;
        await router.testProvider('anthropic');
        assert.strictEqual(router.activeProvider, good);
        internals.providers = [bad];
        internals._activeProvider = bad;
        await router.testProvider('anthropic');
        assert.strictEqual(router.activeProvider, null, 'no other provider');
    });

    test('the panel row shows the check, which says more than the key format', () => {
        const config = { mode: 'auto', anthropicModel: 'm', openaiModel: 'm', ollamaEnabled: true, ollamaBaseUrl: base, ollamaModel: 'llama3' } as DitaCraftLLMConfig;
        const rows = describeProviders(config, new Map([['copilot', false], ['anthropic', true], ['ollama', true]]),
            { anthropic: 'stored', openai: 'none' },
            new Map([['anthropic', { ok: false, detail: 'Anthropic refused the API key (401): check it, or save a new one.' }]]));
        assert.deepStrictEqual(rows.map(r => `${r.id} ${r.state} | ${r.detail}`).slice(1, 2),
            ['anthropic unavailable | Anthropic refused the API key (401): check it, or save a new one.']);
    });
});
