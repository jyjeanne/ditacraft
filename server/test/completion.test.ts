import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { handleCompletion } from '../src/features/completion';
import { KeySpaceService, KeyDefinition } from '../src/services/keySpaceService';
import { createDoc, createDocs, TEST_URI } from './helper';

function complete(content: string, line: number, character: number) {
    const doc = createDoc(content);
    const docs = createDocs(doc);
    return handleCompletion(
        {
            textDocument: { uri: TEST_URI },
            position: { line, character },
        },
        docs
    );
}

suite('handleCompletion', () => {
    suite('Element completions', () => {
        test('after < inside topic body returns child elements', async () => {
            const content = '<topic id="t1"><body><</body></topic>';
            // < is at offset 21; cursor must be after < (offset 22) for context detection
            const items = await complete(content, 0, 22);
            assert.ok(items.length > 0);
            const labels = items.map(i => i.label);
            assert.ok(labels.includes('p'), 'should include <p>');
            assert.ok(labels.includes('section'), 'should include <section>');
        });

        test('after < inside topic returns topic children', async () => {
            const content = '<topic id="t1"><</topic>';
            const items = await complete(content, 0, 16);
            assert.ok(items.length > 0);
            const labels = items.map(i => i.label);
            assert.ok(labels.includes('title'), 'should include <title>');
            assert.ok(labels.includes('body'), 'should include <body>');
            assert.ok(labels.includes('titlealts'), 'should include <titlealts>');
        });

        test('unknown parent returns empty', async () => {
            const content = '<unknownelement><</unknownelement>';
            const items = await complete(content, 0, 18);
            assert.strictEqual(items.length, 0);
        });
    });

    suite('Attribute completions', () => {
        test('inside opening tag after space returns attributes', async () => {
            const content = '<topic >';
            const items = await complete(content, 0, 7);
            assert.ok(items.length > 0);
            const labels = items.map(i => i.label);
            assert.ok(labels.includes('id'), 'should include id');
        });

        test('inside topicref returns topicref-specific attributes', async () => {
            const content = '<topicref >';
            const items = await complete(content, 0, 10);
            assert.ok(items.length > 0);
            const labels = items.map(i => i.label);
            assert.ok(labels.includes('href'), 'should include href');
        });
    });

    suite('Attribute value completions', () => {
        test('inside type="" returns type values', async () => {
            const content = '<note type="">';
            // cursor inside the quotes at position 12
            const items = await complete(content, 0, 12);
            assert.ok(items.length > 0);
            const labels = items.map(i => i.label);
            assert.ok(labels.includes('note'), 'should include note type');
            assert.ok(labels.includes('warning'), 'should include warning type');
        });

        test('inside scope="" returns scope values', async () => {
            const content = '<xref scope="">';
            const items = await complete(content, 0, 13);
            assert.ok(items.length > 0);
            const labels = items.map(i => i.label);
            assert.ok(labels.includes('local'));
            assert.ok(labels.includes('external'));
        });

        test('unknown attribute returns empty', async () => {
            const content = '<topic unknownattr="">';
            const items = await complete(content, 0, 20);
            assert.strictEqual(items.length, 0);
        });
    });

    suite('No completions', () => {
        test('in text content returns empty', async () => {
            const content = '<p>text here</p>';
            const items = await complete(content, 0, 6);
            assert.strictEqual(items.length, 0);
        });

        test('in closing tag returns empty', async () => {
            const content = '<topic></topic>';
            const items = await complete(content, 0, 9);
            assert.strictEqual(items.length, 0);
        });

        test('document not found returns empty', async () => {
            const docs = createDocs(); // no documents
            const items = await handleCompletion(
                {
                    textDocument: { uri: 'file:///nonexistent.dita' },
                    position: { line: 0, character: 0 },
                },
                docs
            );
            assert.strictEqual(items.length, 0);
        });
    });

    suite('Snippet format', () => {
        test('element completion uses snippet format', async () => {
            const content = '<topic id="t1"><';
            const items = await complete(content, 0, 16);
            assert.ok(items.length > 0);
            // Verify snippet format: insertText should contain ${1} and closing tag
            const titleItem = items.find(i => i.label === 'title');
            assert.ok(titleItem);
            assert.ok(titleItem.insertText?.includes('</title>'));
        });

        test('attribute completion uses snippet format', async () => {
            const content = '<topic >';
            const items = await complete(content, 0, 7);
            const idItem = items.find(i => i.label === 'id');
            assert.ok(idItem);
            assert.ok(idItem.insertText?.includes('="'));
        });
    });

    suite('DITAVAL completions', () => {
        test('after < inside val returns child elements', async () => {
            const content = '<val><</val>';
            const items = await complete(content, 0, 6);
            assert.ok(items.length > 0);
            const labels = items.map(i => i.label);
            assert.ok(labels.includes('prop'), 'should include <prop>');
            assert.ok(labels.includes('revprop'), 'should include <revprop>');
            assert.ok(labels.includes('style-conflict'), 'should include <style-conflict>');
        });

        test('after < inside prop returns flag elements', async () => {
            const content = '<val><prop action="flag"><</prop></val>';
            const items = await complete(content, 0, 26);
            assert.ok(items.length > 0);
            const labels = items.map(i => i.label);
            assert.ok(labels.includes('startflag'), 'should include <startflag>');
            assert.ok(labels.includes('endflag'), 'should include <endflag>');
        });

        test('prop attributes include only DITAVAL attrs', async () => {
            const content = '<val><prop ></prop></val>';
            const items = await complete(content, 0, 11);
            const labels = items.map(i => i.label);
            assert.ok(labels.includes('action'), 'should include action');
            assert.ok(labels.includes('att'), 'should include att');
            assert.ok(labels.includes('val'), 'should include val');
            assert.ok(!labels.includes('id'), 'should NOT include DITA common attr id');
            assert.ok(!labels.includes('conref'), 'should NOT include DITA common attr conref');
            assert.ok(!labels.includes('outputclass'), 'should NOT include DITA common attr outputclass');
        });

        test('revprop attributes exclude common DITA attrs', async () => {
            const content = '<val><revprop ></revprop></val>';
            const items = await complete(content, 0, 14);
            const labels = items.map(i => i.label);
            assert.ok(labels.includes('action'), 'should include action');
            assert.ok(labels.includes('changebar'), 'should include changebar');
            assert.ok(!labels.includes('keyref'), 'should NOT include keyref');
        });

        test('action attribute value completion', async () => {
            const content = '<val><prop action=""></prop></val>';
            const items = await complete(content, 0, 19);
            assert.ok(items.length > 0);
            const labels = items.map(i => i.label);
            assert.ok(labels.includes('include'), 'should include include');
            assert.ok(labels.includes('exclude'), 'should include exclude');
            assert.ok(labels.includes('flag'), 'should include flag');
            assert.ok(labels.includes('passthrough'), 'should include passthrough');
        });
    });

    suite('Keyref completions (Phase 2)', () => {
        /**
         * Create a mock KeySpaceService that returns predefined keys.
         */
        function createMockKeySpaceService(
            keys: Map<string, KeyDefinition>
        ): KeySpaceService {
            // Minimal mock — only getAllKeys and resolveKey are needed
            return {
                getAllKeys: async () => keys,
                resolveKey: async (keyName: string) => keys.get(keyName) ?? null,
                getWorkspaceFolders: () => [],
                buildKeySpace: async () => ({
                    rootMap: '',
                    keys,
                    buildTime: Date.now(),
                    mapHierarchy: [],
                }),
                findRootMap: async () => '/test/root.ditamap',
                invalidateForFile: () => {},
                updateWorkspaceFolders: () => {},
                reloadCacheConfig: async () => {},
                shutdown: () => {},
            } as unknown as KeySpaceService;
        }

        test('keyref="" offers all key names', async () => {
            const keys = new Map<string, KeyDefinition>([
                ['product-name', {
                    keyName: 'product-name',
                    sourceMap: '/maps/root.ditamap',
                    inlineContent: 'Acme Product',
                    metadata: { navtitle: 'Acme Product' },
                }],
                ['install-guide', {
                    keyName: 'install-guide',
                    sourceMap: '/maps/root.ditamap',
                    targetFile: '/topics/install.dita',
                }],
            ]);
            const keySpaceService = createMockKeySpaceService(keys);

            const content = '<xref keyref="">';
            const doc = createDoc(content);
            const docs = createDocs(doc);
            const items = await handleCompletion(
                { textDocument: { uri: TEST_URI }, position: { line: 0, character: 14 } },
                docs,
                keySpaceService
            );

            assert.ok(items.length === 2, `Expected 2 items, got ${items.length}`);
            const labels = items.map(i => i.label);
            assert.ok(labels.includes('product-name'));
            assert.ok(labels.includes('install-guide'));
        });

        test('keyref items have CompletionItemKind.Reference', async () => {
            const keys = new Map<string, KeyDefinition>([
                ['my-key', { keyName: 'my-key', sourceMap: '/map.ditamap' }],
            ]);
            const keySpaceService = createMockKeySpaceService(keys);

            const content = '<xref keyref="">';
            const doc = createDoc(content);
            const docs = createDocs(doc);
            const items = await handleCompletion(
                { textDocument: { uri: TEST_URI }, position: { line: 0, character: 14 } },
                docs,
                keySpaceService
            );

            assert.strictEqual(items.length, 1);
            assert.strictEqual(items[0].kind, 18); // CompletionItemKind.Reference = 18
        });

        test('keyref with partial text filters (prefix available)', async () => {
            const keys = new Map<string, KeyDefinition>([
                ['alpha', { keyName: 'alpha', sourceMap: '/map.ditamap' }],
                ['beta', { keyName: 'beta', sourceMap: '/map.ditamap' }],
            ]);
            const keySpaceService = createMockKeySpaceService(keys);

            // "al" typed so far — editor will filter based on prefix
            const content = '<xref keyref="al">';
            const doc = createDoc(content);
            const docs = createDocs(doc);
            const items = await handleCompletion(
                { textDocument: { uri: TEST_URI }, position: { line: 0, character: 16 } },
                docs,
                keySpaceService
            );

            // Both keys returned; VS Code client does the filtering
            assert.ok(items.length === 2);
        });

        test('conkeyref="" offers all key names', async () => {
            const keys = new Map<string, KeyDefinition>([
                ['snippet-key', { keyName: 'snippet-key', sourceMap: '/map.ditamap', targetFile: '/topics/snippet.dita' }],
            ]);
            const keySpaceService = createMockKeySpaceService(keys);

            const content = '<p conkeyref="">';
            const doc = createDoc(content);
            const docs = createDocs(doc);
            const items = await handleCompletion(
                { textDocument: { uri: TEST_URI }, position: { line: 0, character: 14 } },
                docs,
                keySpaceService
            );

            assert.strictEqual(items.length, 1);
            assert.strictEqual(items[0].label, 'snippet-key');
        });

        test('conkeyref="key/" offers element IDs from key target', async () => {
            // Create a temporary file with IDs
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const targetFile = path.join(tmpDir, 'target.dita');
            fs.writeFileSync(targetFile, '<topic id="t1"><body><p id="p1">text</p><p id="p2">more</p></body></topic>');

            try {
                const keys = new Map<string, KeyDefinition>([
                    ['my-key', { keyName: 'my-key', sourceMap: '/map.ditamap', targetFile }],
                ]);
                const keySpaceService = createMockKeySpaceService(keys);

                const content = '<p conkeyref="my-key/">';
                const doc = createDoc(content);
                const docs = createDocs(doc);
                const items = await handleCompletion(
                    { textDocument: { uri: TEST_URI }, position: { line: 0, character: 21 } },
                    docs,
                    keySpaceService
                );

                assert.ok(items.length >= 2, `Expected at least 2 IDs, got ${items.length}`);
                const labels = items.map(i => i.label);
                // Should include element IDs (t1, p1, p2)
                assert.ok(labels.includes('p1'), 'should include p1');
                assert.ok(labels.includes('p2'), 'should include p2');
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('without keySpaceService, keyref returns empty', async () => {
            const content = '<xref keyref="">';
            const doc = createDoc(content);
            const docs = createDocs(doc);
            const items = await handleCompletion(
                { textDocument: { uri: TEST_URI }, position: { line: 0, character: 14 } },
                docs
                // no keySpaceService
            );

            assert.strictEqual(items.length, 0);
        });
    });

    suite('Href fragment completions (Phase 2)', () => {
        test('href with # offers topic IDs from target file', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const targetFile = path.join(tmpDir, 'target.dita');
            fs.writeFileSync(targetFile,
                '<topic id="main-topic"><body><section id="s1">text</section></body></topic>\n' +
                '<concept id="second-topic"><conbody><p>text</p></conbody></concept>'
            );

            try {
                const testUri = `file:///${tmpDir.replace(/\\/g, '/')}/source.dita`;
                const content = `<xref href="target.dita#">`;
                const doc = createDoc(content, testUri);
                const docs = createDocs(doc);

                const items = await handleCompletion(
                    { textDocument: { uri: testUri }, position: { line: 0, character: 24 } },
                    docs
                );
                assert.ok(items.length >= 2, `Expected >=2 topic IDs, got ${items.length}`);
                const labels = items.map(i => i.label);
                assert.ok(labels.includes('main-topic'), 'should include main-topic');
                assert.ok(labels.includes('second-topic'), 'should include second-topic');
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('href with #topicid/ offers element IDs within that topic', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const targetFile = path.join(tmpDir, 'target.dita');
            fs.writeFileSync(targetFile,
                '<topic id="main-topic"><body>' +
                '<p id="para1">text</p>' +
                '<p id="para2">more</p>' +
                '</body></topic>'
            );

            try {
                const testUri = `file:///${tmpDir.replace(/\\/g, '/')}/source.dita`;
                const content = `<xref href="target.dita#main-topic/">`;
                const doc = createDoc(content, testUri);
                const docs = createDocs(doc);

                const items = await handleCompletion(
                    { textDocument: { uri: testUri }, position: { line: 0, character: 35 } },
                    docs
                );
                const labels = items.map(i => i.label);
                assert.ok(labels.includes('para1'), 'should include para1');
                assert.ok(labels.includes('para2'), 'should include para2');
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('href with # pointing to nonexistent file returns empty', async () => {
            const content = '<xref href="nonexistent.dita#">';
            const items = await complete(content, 0, 29);
            assert.strictEqual(items.length, 0);
        });
    });

    suite('Href file path completions (Phase 3)', () => {
        test('href="" lists .dita files from current directory', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            fs.writeFileSync(path.join(tmpDir, 'install.dita'), '<topic id="t1"/>');
            fs.writeFileSync(path.join(tmpDir, 'overview.dita'), '<topic id="t2"/>');
            fs.writeFileSync(path.join(tmpDir, 'readme.txt'), 'not a dita file');

            try {
                const testUri = `file:///${tmpDir.replace(/\\/g, '/')}/source.dita`;
                const content = '<xref href="">';
                const doc = createDoc(content, testUri);
                const docs = createDocs(doc);

                const items = await handleCompletion(
                    { textDocument: { uri: testUri }, position: { line: 0, character: 12 } },
                    docs
                );

                const labels = items.map(i => i.label);
                assert.ok(labels.includes('install.dita'), 'should include install.dita');
                assert.ok(labels.includes('overview.dita'), 'should include overview.dita');
                assert.ok(!labels.includes('readme.txt'), 'should NOT include readme.txt');
                assert.ok(!labels.includes('source.dita'), 'should NOT include self');
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('href lists subdirectories with trailing slash', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            fs.mkdirSync(path.join(tmpDir, 'topics'));
            fs.writeFileSync(path.join(tmpDir, 'topics', 'guide.dita'), '<topic id="t1"/>');

            try {
                const testUri = `file:///${tmpDir.replace(/\\/g, '/')}/source.dita`;
                const content = '<xref href="">';
                const doc = createDoc(content, testUri);
                const docs = createDocs(doc);

                const items = await handleCompletion(
                    { textDocument: { uri: testUri }, position: { line: 0, character: 12 } },
                    docs
                );

                const labels = items.map(i => i.label);
                assert.ok(labels.includes('topics/'), 'should include topics/ directory');
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('href with subdirectory prefix lists files in that dir', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            fs.mkdirSync(path.join(tmpDir, 'topics'));
            fs.writeFileSync(path.join(tmpDir, 'topics', 'guide.dita'), '<topic id="t1"/>');
            fs.writeFileSync(path.join(tmpDir, 'topics', 'faq.dita'), '<topic id="t2"/>');

            try {
                const testUri = `file:///${tmpDir.replace(/\\/g, '/')}/source.dita`;
                const content = '<xref href="topics/">';
                const doc = createDoc(content, testUri);
                const docs = createDocs(doc);

                const items = await handleCompletion(
                    { textDocument: { uri: testUri }, position: { line: 0, character: 19 } },
                    docs
                );

                const labels = items.map(i => i.label);
                assert.ok(labels.includes('guide.dita'), 'should include guide.dita');
                assert.ok(labels.includes('faq.dita'), 'should include faq.dita');
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('conref lists .dita files too', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            fs.writeFileSync(path.join(tmpDir, 'shared.dita'), '<topic id="t1"/>');

            try {
                const testUri = `file:///${tmpDir.replace(/\\/g, '/')}/source.dita`;
                const content = '<p conref="">';
                const doc = createDoc(content, testUri);
                const docs = createDocs(doc);

                const items = await handleCompletion(
                    { textDocument: { uri: testUri }, position: { line: 0, character: 11 } },
                    docs
                );

                const labels = items.map(i => i.label);
                assert.ok(labels.includes('shared.dita'), 'should include shared.dita');
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('href for nonexistent directory returns empty', async () => {
            const content = '<xref href="nonexistent/">';
            const items = await complete(content, 0, 24);
            assert.strictEqual(items.length, 0);
        });

        test('href skips hidden files and directories', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            fs.writeFileSync(path.join(tmpDir, '.hidden.dita'), '<topic id="t1"/>');
            fs.writeFileSync(path.join(tmpDir, 'visible.dita'), '<topic id="t2"/>');

            try {
                const testUri = `file:///${tmpDir.replace(/\\/g, '/')}/source.dita`;
                const content = '<xref href="">';
                const doc = createDoc(content, testUri);
                const docs = createDocs(doc);

                const items = await handleCompletion(
                    { textDocument: { uri: testUri }, position: { line: 0, character: 12 } },
                    docs
                );

                const labels = items.map(i => i.label);
                assert.ok(labels.includes('visible.dita'), 'should include visible.dita');
                assert.ok(!labels.includes('.hidden.dita'), 'should NOT include hidden files');
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });
    });
});
