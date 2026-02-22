import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { URI } from 'vscode-uri';
import { handleHover } from '../src/features/hover';
import { KeySpaceService, KeyDefinition } from '../src/services/keySpaceService';
import { createDoc, createDocs, TEST_URI } from './helper';

function hover(content: string, line: number, character: number) {
    const doc = createDoc(content);
    const docs = createDocs(doc);
    return handleHover(
        {
            textDocument: { uri: TEST_URI },
            position: { line, character },
        },
        docs
    );
}

suite('handleHover', () => {
    suite('Known elements', () => {
        test('cursor on <topic> returns documentation', async () => {
            const content = '<topic id="t1"><title>T</title></topic>';
            const result = await hover(content, 0, 2); // on "pic" of topic
            assert.ok(result);
            assert.ok(result.contents);
        });

        test('cursor on <section> returns documentation', async () => {
            const content = '<topic id="t1"><body><section><title>S</title></section></body></topic>';
            const result = await hover(content, 0, 24); // on "ction"
            assert.ok(result);
        });

        test('cursor on <step> returns documentation', async () => {
            const content = '<topic id="t1"><taskbody><steps><step><cmd>Do it</cmd></step></steps></taskbody></topic>';
            const result = await hover(content, 0, 34); // on "step"
            assert.ok(result);
        });

        test('cursor on <title> returns documentation', async () => {
            const content = '<topic id="t1"><title>T</title></topic>';
            const result = await hover(content, 0, 17); // on "title" in opening tag
            assert.ok(result);
        });

        test('cursor on <titlealts> returns documentation', async () => {
            const content = '<topic id="t1"><titlealts><navtitle>Nav</navtitle></titlealts></topic>';
            const result = await hover(content, 0, 18); // on "titlealts"
            assert.ok(result);
            const mc = result.contents as { kind: string; value: string };
            assert.strictEqual(mc.kind, 'markdown');
            assert.ok(mc.value.includes('Alternative titles'));
        });

        test('cursor on <navtitle> returns documentation', async () => {
            const content = '<topic id="t1"><titlealts><navtitle>Nav</navtitle></titlealts></topic>';
            const result = await hover(content, 0, 28); // on "navtitle"
            assert.ok(result);
            const mc = result.contents as { kind: string; value: string };
            assert.ok(mc.value.includes('Navigation title'));
        });

        test('hover result contains markdown', async () => {
            const content = '<topic id="t1"><title>T</title></topic>';
            const result = await hover(content, 0, 2);
            assert.ok(result);
            const mc = result.contents as { kind: string; value: string };
            assert.strictEqual(mc.kind, 'markdown');
            assert.ok(mc.value.length > 0);
        });
    });

    suite('Known elements without full docs (children only)', () => {
        test('element in DITA_ELEMENTS but not ELEMENT_DOCS shows children', async () => {
            // <dlentry> is in DITA_ELEMENTS (children: dt, dd) but NOT in ELEMENT_DOCS
            // This exercises the children-only fallback path in handleHover
            const content = '<dl><dlentry></dlentry></dl>';
            const result = await hover(content, 0, 6); // on "lentry" of <dlentry>
            assert.ok(result);
            const mc = result.contents as { kind: string; value: string };
            assert.strictEqual(mc.kind, 'markdown');
            assert.ok(mc.value.includes('Children'), 'should show children list');
            assert.ok(mc.value.includes('dt'), 'should list dt as child');
        });
    });

    suite('Unknown elements', () => {
        test('cursor on unknown element returns null', async () => {
            const content = '<unknownelement>text</unknownelement>';
            const result = await hover(content, 0, 3);
            assert.strictEqual(result, null);
        });
    });

    suite('Non-tag positions', () => {
        test('cursor in text content returns null', async () => {
            const content = '<p>some text here</p>';
            const result = await hover(content, 0, 8); // on "text"
            assert.strictEqual(result, null);
        });

        test('cursor in attribute value returns null', async () => {
            const content = '<topic id="myid"><title>T</title></topic>';
            const result = await hover(content, 0, 13); // inside "myid"
            assert.strictEqual(result, null);
        });

        test('cursor on closing tag returns documentation', async () => {
            const content = '<topic id="t1"><title>T</title></topic>';
            // closing tag </topic> — cursor on "topic" in closing
            const result = await hover(content, 0, 34); // on "topic" in </topic>
            assert.ok(result);
        });
    });

    suite('Edge cases', () => {
        test('document not found returns null', async () => {
            const docs = createDocs(); // empty
            const result = await handleHover(
                {
                    textDocument: { uri: 'file:///nonexistent.dita' },
                    position: { line: 0, character: 0 },
                },
                docs
            );
            assert.strictEqual(result, null);
        });

        test('cursor at start of document returns null', async () => {
            const content = 'plain text no tags';
            const result = await hover(content, 0, 0);
            assert.strictEqual(result, null);
        });

        test('empty document returns null', async () => {
            const result = await hover('', 0, 0);
            assert.strictEqual(result, null);
        });
    });

    suite('DITAVAL elements', () => {
        test('cursor on <val> returns documentation', async () => {
            const content = '<val><prop action="include"/></val>';
            const result = await hover(content, 0, 2); // on "al" of val
            assert.ok(result);
            const mc = result.contents as { kind: string; value: string };
            assert.strictEqual(mc.kind, 'markdown');
            assert.ok(mc.value.includes('DITAVAL root element'));
        });

        test('cursor on <prop> returns documentation', async () => {
            const content = '<val><prop action="include"/></val>';
            const result = await hover(content, 0, 7); // on "rop" of prop
            assert.ok(result);
            const mc = result.contents as { kind: string; value: string };
            assert.ok(mc.value.includes('Property condition'));
        });

        test('cursor on <revprop> returns documentation', async () => {
            const content = '<val><revprop action="flag"/></val>';
            const result = await hover(content, 0, 8); // on "vprop" of revprop
            assert.ok(result);
            const mc = result.contents as { kind: string; value: string };
            assert.ok(mc.value.includes('Revision property'));
        });

        test('cursor on <style-conflict> returns documentation', async () => {
            const content = '<val><style-conflict foreground-conflict-color="#000000"/></val>';
            const result = await hover(content, 0, 10); // on "e-conflict" of style-conflict
            assert.ok(result);
            const mc = result.contents as { kind: string; value: string };
            assert.ok(mc.value.includes('Style conflict'));
        });

        test('cursor on <startflag> returns documentation', async () => {
            const content = '<val><prop action="flag"><startflag imageref="flag.png"/></prop></val>';
            const result = await hover(content, 0, 28); // on "artflag" of startflag
            assert.ok(result);
            const mc = result.contents as { kind: string; value: string };
            assert.ok(mc.value.includes('Start flag'));
        });
    });

    suite('Keyref hover (Phase 4)', () => {
        function createMockKeySpaceService(
            keys: Map<string, KeyDefinition>
        ): KeySpaceService {
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

        test('keyref hover shows key metadata', async () => {
            const keys = new Map<string, KeyDefinition>([
                ['product-name', {
                    keyName: 'product-name',
                    sourceMap: '/maps/root.ditamap',
                    inlineContent: 'Acme Product',
                    metadata: { navtitle: 'Acme Product', shortdesc: 'The main product' },
                }],
            ]);
            const keySpaceService = createMockKeySpaceService(keys);

            const content = '<keyword keyref="product-name">fallback</keyword>';
            const doc = createDoc(content);
            const docs = createDocs(doc);
            // Cursor inside "product-name" value (offset ~25)
            const result = await handleHover(
                { textDocument: { uri: TEST_URI }, position: { line: 0, character: 25 } },
                docs,
                keySpaceService
            );

            assert.ok(result);
            const mc = result.contents as { kind: string; value: string };
            assert.strictEqual(mc.kind, 'markdown');
            assert.ok(mc.value.includes('product-name'), 'should show key name');
            assert.ok(mc.value.includes('Acme Product'), 'should show navtitle');
            assert.ok(mc.value.includes('The main product'), 'should show shortdesc');
            assert.ok(mc.value.includes('root.ditamap'), 'should show source map');
        });

        test('keyref hover with target file shows target', async () => {
            const keys = new Map<string, KeyDefinition>([
                ['install-guide', {
                    keyName: 'install-guide',
                    sourceMap: '/maps/root.ditamap',
                    targetFile: '/topics/install.dita',
                }],
            ]);
            const keySpaceService = createMockKeySpaceService(keys);

            const content = '<xref keyref="install-guide">Install</xref>';
            const doc = createDoc(content);
            const docs = createDocs(doc);
            const result = await handleHover(
                { textDocument: { uri: TEST_URI }, position: { line: 0, character: 20 } },
                docs,
                keySpaceService
            );

            assert.ok(result);
            const mc = result.contents as { kind: string; value: string };
            assert.ok(mc.value.includes('install.dita'), 'should show target file');
        });

        test('conkeyref hover shows key and element ID', async () => {
            const keys = new Map<string, KeyDefinition>([
                ['snippet', {
                    keyName: 'snippet',
                    sourceMap: '/maps/root.ditamap',
                    targetFile: '/topics/snippets.dita',
                }],
            ]);
            const keySpaceService = createMockKeySpaceService(keys);

            const content = '<p conkeyref="snippet/intro">fallback</p>';
            const doc = createDoc(content);
            const docs = createDocs(doc);
            const result = await handleHover(
                { textDocument: { uri: TEST_URI }, position: { line: 0, character: 20 } },
                docs,
                keySpaceService
            );

            assert.ok(result);
            const mc = result.contents as { kind: string; value: string };
            assert.ok(mc.value.includes('snippet'), 'should show key name');
            assert.ok(mc.value.includes('intro'), 'should show element ID');
            assert.ok(mc.value.includes('snippets.dita'), 'should show target file');
        });

        test('keyref hover for unknown key shows warning', async () => {
            const keys = new Map<string, KeyDefinition>();
            const keySpaceService = createMockKeySpaceService(keys);

            const content = '<xref keyref="nonexistent">text</xref>';
            const doc = createDoc(content);
            const docs = createDocs(doc);
            const result = await handleHover(
                { textDocument: { uri: TEST_URI }, position: { line: 0, character: 20 } },
                docs,
                keySpaceService
            );

            assert.ok(result);
            const mc = result.contents as { kind: string; value: string };
            assert.ok(mc.value.includes('not found'), 'should show key not found warning');
        });

        test('keyref hover without keySpaceService falls through', async () => {
            const content = '<xref keyref="some-key">text</xref>';
            const doc = createDoc(content);
            const docs = createDocs(doc);
            // No keySpaceService — should fall through to element hover
            const result = await handleHover(
                { textDocument: { uri: TEST_URI }, position: { line: 0, character: 20 } },
                docs
            );

            // Falls through to element hover — "xref" tag is not at this position,
            // so the cursor is in the attribute value → returns null
            assert.strictEqual(result, null);
        });
    });

    suite('Href hover (Phase 4)', () => {
        test('href hover shows resolved path', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-test-'));
            const targetFile = path.join(tmpDir, 'target.dita');
            fs.writeFileSync(targetFile, '<topic id="t1"><body><p>text</p></body></topic>');

            try {
                const testUri = URI.file(path.join(tmpDir, 'source.dita')).toString();
                const content = '<xref href="target.dita">link</xref>';
                const doc = createDoc(content, testUri);
                const docs = createDocs(doc);

                const result = await handleHover(
                    { textDocument: { uri: testUri }, position: { line: 0, character: 18 } },
                    docs
                );

                assert.ok(result);
                const mc = result.contents as { kind: string; value: string };
                assert.ok(mc.value.includes('href'), 'should show attr type');
                assert.ok(mc.value.includes('target.dita'), 'should show file name');
                assert.ok(!mc.value.includes('not found'), 'should NOT show not-found warning');
            } finally {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            }
        });

        test('href hover shows warning for missing file', async () => {
            const content = '<xref href="nonexistent.dita">link</xref>';
            const doc = createDoc(content);
            const docs = createDocs(doc);

            const result = await handleHover(
                { textDocument: { uri: TEST_URI }, position: { line: 0, character: 18 } },
                docs
            );

            assert.ok(result);
            const mc = result.contents as { kind: string; value: string };
            assert.ok(mc.value.includes('not found'), 'should show not-found warning');
        });

        test('href hover with fragment shows fragment info', async () => {
            const content = '<xref href="file.dita#topicid/elemid">link</xref>';
            const doc = createDoc(content);
            const docs = createDocs(doc);

            const result = await handleHover(
                { textDocument: { uri: TEST_URI }, position: { line: 0, character: 25 } },
                docs
            );

            assert.ok(result);
            const mc = result.contents as { kind: string; value: string };
            assert.ok(mc.value.includes('topicid/elemid'), 'should show fragment');
        });

        test('href hover for external link shows external', async () => {
            const content = '<xref href="https://example.com" scope="external">link</xref>';
            const doc = createDoc(content);
            const docs = createDocs(doc);

            const result = await handleHover(
                { textDocument: { uri: TEST_URI }, position: { line: 0, character: 20 } },
                docs
            );

            assert.ok(result);
            const mc = result.contents as { kind: string; value: string };
            assert.ok(mc.value.includes('External link'), 'should show external link');
        });

        test('conref hover shows resolved path', async () => {
            const content = '<p conref="other.dita#topic/para1">fallback</p>';
            const doc = createDoc(content);
            const docs = createDocs(doc);

            const result = await handleHover(
                { textDocument: { uri: TEST_URI }, position: { line: 0, character: 18 } },
                docs
            );

            assert.ok(result);
            const mc = result.contents as { kind: string; value: string };
            assert.ok(mc.value.includes('conref'), 'should show conref type');
            assert.ok(mc.value.includes('topic/para1'), 'should show fragment');
        });
    });
});
