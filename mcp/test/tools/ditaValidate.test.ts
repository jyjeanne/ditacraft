/**
 * Integration tests for dita_validate tool.
 * Spawns MCP server, calls tool, validates responses.
 */
import * as assert from 'assert';
import { createTestWorkspace, TestWorkspace } from '../helper';

const TOPIC_VALID = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
    '<topic id="test">',
    '  <title>Test Topic</title>',
    '  <body><p>Hello world.</p></body>',
    '</topic>',
].join('\n');

const TOPIC_MISSING_TITLE = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
    '<topic id="test">',
    '  <body><p>No title here.</p></body>',
    '</topic>',
].join('\n');

const BROKEN_XML = '<topic><title>Bad</topic>';

const MAP_WITH_KEY = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">',
    '<map>',
    '  <title>Test Map</title>',
    '  <topicref href="valid-topic.dita" keys="test-key"/>',
    '</map>',
].join('\n');

suite('dita_validate', () => {

    let ws: TestWorkspace;

    suiteSetup(async () => {
        ws = await createTestWorkspace();
        ws.addFile('valid-topic.dita', TOPIC_VALID);
        ws.addFile('missing-title.dita', TOPIC_MISSING_TITLE);
        ws.addFile('broken-xml.dita', BROKEN_XML);
        ws.addFile('test-map.ditamap', MAP_WITH_KEY);
    });

    suiteTeardown(async () => {
        await ws.cleanup();
    });

    suite('File validation', () => {

        test('validates a valid topic file', async () => {
            const result = await ws.callTool('dita_validate', { uri: 'valid-topic.dita' }) as Record<string, unknown>;
            assert.strictEqual(result.isValid, true);
            assert.strictEqual(result.errorCount, 0);
        });

        test('validates a topic missing <title>', async () => {
            const result = await ws.callTool('dita_validate', { uri: 'missing-title.dita' }) as Record<string, unknown>;
            assert.strictEqual(result.isValid, false);
            // Should have at least one diagnostic about the missing title
            const diags = result.diagnostics as Array<{ code: string }>;
            assert.ok(diags.length > 0);
            const codes = diags.map((d) => d.code);
            assert.ok(codes.some((c) => c.includes('STRUCT-003') || c.includes('STRUCT-004') || c.includes('TITLE')));
        });

        test('validates a file with broken XML syntax', async () => {
            const result = await ws.callTool('dita_validate', { uri: 'broken-xml.dita' }) as Record<string, unknown>;
            assert.strictEqual(result.isValid, false);
            assert.ok((result.errorCount as number) > 0);
        });

        test('returns error for non-existent file', async () => {
            const result = await ws.callTool('dita_validate', { uri: 'does-not-exist.dita' }) as Record<string, unknown>;
            assert.ok(typeof result.error === 'string');
        });

    });

    suite('Fragment validation', () => {

        test('validates a valid topic fragment', async () => {
            const fragment = '<topic id="f"><title>Test</title><body><p>OK</p></body></topic>';
            const result = await ws.callTool('dita_validate', { fragment, fragmentType: 'topic' }) as Record<string, unknown>;
            assert.strictEqual(result.isValid, true);
        });

        test('validates a map fragment missing title', async () => {
            const fragment = '<map><topicref href="topic.dita"/></map>';
            const result = await ws.callTool('dita_validate', { fragment, fragmentType: 'map' }) as Record<string, unknown>;
            // Map without title should get diagnostics
            assert.ok(result.diagnostics !== undefined || result.isValid !== undefined);
        });

    });

    suite('Error handling', () => {

        test('returns error when both uri and fragment are missing', async () => {
            const result = await ws.callTool('dita_validate', {}) as Record<string, unknown>;
            assert.ok(typeof result.error === 'string');
        });

        test('returns error when fragment provided without fragmentType', async () => {
            const result = await ws.callTool('dita_validate', { fragment: '<topic/>' }) as Record<string, unknown>;
            assert.ok(typeof result.error === 'string');
        });

        test('handles UTF-8 content with CJK characters', async () => {
            const content = [
                '<?xml version="1.0" encoding="UTF-8"?>',
                '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
                '<topic id="cjk">',
                '  <title>日本語テスト</title>',
                '  <body><p>中文测试 한글테스트</p></body>',
                '</topic>',
            ].join('\n');
            ws.addFile('cjk.dita', content);
            const result = await ws.callTool('dita_validate', { uri: 'cjk.dita' }) as Record<string, unknown>;
            // Should not throw — just check it returns a result
            assert.ok(typeof result.isValid === 'boolean');
        });

    });

    suite('Fresh results (regression)', () => {
        // Files were validated as version 0 and fragments under one fixed URI, so the
        // pipeline's per-phase cache answered with the first result for 5 minutes.

        test('a file edited after a validation is validated again', async () => {
            ws.addFile('edited.dita', TOPIC_VALID);
            const before = await ws.callTool('dita_validate', { uri: 'edited.dita' }) as Record<string, unknown>;
            assert.strictEqual(before.isValid, true);

            ws.addFile('edited.dita', TOPIC_MISSING_TITLE);
            const broken = await ws.callTool('dita_validate', { uri: 'edited.dita' }) as Record<string, unknown>;
            assert.strictEqual(broken.isValid, false, 'the edit must be seen, not the cached result');

            ws.addFile('edited.dita', TOPIC_VALID);
            const fixed = await ws.callTool('dita_validate', { uri: 'edited.dita' }) as Record<string, unknown>;
            assert.strictEqual(fixed.isValid, true, 'the fix must be seen, not the cached result');
        });

        test('each fragment gets its own result', async () => {
            const valid = '<topic id="f1"><title>Title</title><body><p>OK</p></body></topic>';
            const noTitle = '<topic id="f2"><body><p>No title</p></body></topic>';
            const first = await ws.callTool('dita_validate', { fragment: valid, fragmentType: 'topic' }) as Record<string, unknown>;
            const second = await ws.callTool('dita_validate', { fragment: noTitle, fragmentType: 'topic' }) as Record<string, unknown>;
            assert.strictEqual(first.isValid, true);
            assert.strictEqual(second.isValid, false, 'the second fragment must not get the first one\'s result');
        });
    });

});

suite('dita_validate — map changes (regression)', () => {
    // Key spaces and subject schemes are built from the maps and cached; the language
    // server drops them on the editor's file events, which the MCP server never gets.

    const topic = (id: string, attributes: string, body: string) => [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
        `<topic id="${id}"${attributes}>`,
        `  <title>${id}</title>`,
        `  <body>${body}<p>Second paragraph.</p></body>`,
        '</topic>',
    ].join('\n');
    const map = (refs: string) => [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">',
        '<map>',
        '  <title>Root</title>',
        refs,
        '</map>',
    ].join('\n');

    test('a key added to a map is seen by the next validation', async () => {
        const ws = await createTestWorkspace({
            files: {
                'root.ditamap': map('  <topicref href="a.dita" keys="a"/>'),
                'a.dita': topic('a', '', '<p>See <xref keyref="b"/>.</p>'),
                'b.dita': topic('b', '', '<p>B.</p>'),
            },
        });
        try {
            assert.ok((await codesOf(ws, 'a.dita')).includes('DITA-KEY-001'), 'key b is not defined yet');
            ws.addFile('root.ditamap', map('  <topicref href="a.dita" keys="a"/>\n  <topicref href="b.dita" keys="b"/>'));
            assert.ok(!(await codesOf(ws, 'a.dita')).includes('DITA-KEY-001'), 'key b is defined now');
            const keySpace = await ws.callTool('dita_key_space', { mapUri: 'root.ditamap' }) as { keys: Array<{ keyName: string }> };
            assert.ok(JSON.stringify(keySpace).includes('"b"'), 'dita_key_space lists the new key');
        } finally {
            await ws.cleanup();
        }
    });

    test('a value added to the subject scheme is seen by the next validation', async () => {
        const scheme = (values: string) => [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<!DOCTYPE subjectScheme PUBLIC "-//OASIS//DTD DITA Subject Scheme Map//EN" "subjectScheme.dtd">',
            '<subjectScheme>',
            '  <subjectdef keys="audiences">',
            values,
            '  </subjectdef>',
            '  <enumerationdef>',
            '    <attributedef name="audience"/>',
            '    <subjectdef keyref="audiences"/>',
            '  </enumerationdef>',
            '</subjectScheme>',
        ].join('\n');
        const ws = await createTestWorkspace({
            files: {
                'root.ditamap': map('  <mapref href="scheme.ditamap" format="ditamap"/>\n  <topicref href="t.dita"/>'),
                'scheme.ditamap': scheme('    <subjectdef keys="novice"/>'),
                't.dita': topic('t', ' audience="expert"', '<p>Text.</p>'),
            },
        });
        try {
            assert.ok((await codesOf(ws, 't.dita')).includes('DITA-PROF-001'), '"expert" is not a controlled value yet');
            ws.addFile('scheme.ditamap', scheme('    <subjectdef keys="novice"/>\n    <subjectdef keys="expert"/>'));
            assert.ok(!(await codesOf(ws, 't.dita')).includes('DITA-PROF-001'), '"expert" is a controlled value now');
        } finally {
            await ws.cleanup();
        }
    });
});

const DRAFT_TOPIC = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
    '<topic id="draft">',
    '  <title>Draft</title>',
    '  <body><p>Text.<draft-comment>To do</draft-comment></p></body>',
    '</topic>',
].join('\n');

const rulesFile = (id: string) => JSON.stringify({
    rules: [{ id, pattern: '<draft-comment\\b', message: 'Remove draft comments', severity: 'warning' }],
});

async function codesOf(ws: TestWorkspace, uri: string): Promise<string[]> {
    const result = await ws.callTool('dita_validate', { uri }) as { diagnostics: Array<{ code: string }> };
    return result.diagnostics.map((d) => d.code);
}

suite('dita_validate — configuration', () => {

    test('applies ditacraft.* settings from .vscode/settings.json (comments, trailing commas, relative paths)', async () => {
        const ws = await createTestWorkspace({
            files: {
                '.vscode/settings.json': [
                    '{',
                    '    // Project rules, relative to the workspace',
                    '    "ditacraft.customRulesFile": "rules/custom.json",',
                    '    /* not a DITA Craft setting */ "editor.tabSize": 4,',
                    '}',
                ].join('\n'),
                'rules/custom.json': rulesFile('PROJECT-001'),
                'draft.dita': DRAFT_TOPIC,
            },
        });
        try {
            assert.ok((await codesOf(ws, 'draft.dita')).includes('PROJECT-001'));
        } finally {
            await ws.cleanup();
        }
    });

    test('expands ${workspaceFolder} in path settings', async () => {
        const ws = await createTestWorkspace({
            files: {
                '.vscode/settings.json': '{ "ditacraft.customRulesFile": "${workspaceFolder}/rules/custom.json" }',
                'rules/custom.json': rulesFile('PROJECT-002'),
                'draft.dita': DRAFT_TOPIC,
            },
        });
        try {
            assert.ok((await codesOf(ws, 'draft.dita')).includes('PROJECT-002'));
        } finally {
            await ws.cleanup();
        }
    });

    test('DITACRAFT_CUSTOM_RULES_FILE overrides the settings file', async () => {
        const ws = await createTestWorkspace({
            files: {
                '.vscode/settings.json': '{ "ditacraft.customRulesFile": "rules/custom.json" }',
                'rules/custom.json': rulesFile('FROM-SETTINGS'),
                'rules/ci.json': rulesFile('FROM-ENV'),
                'draft.dita': DRAFT_TOPIC,
            },
            env: { DITACRAFT_CUSTOM_RULES_FILE: 'rules/ci.json' },
        });
        try {
            const codes = await codesOf(ws, 'draft.dita');
            assert.ok(codes.includes('FROM-ENV'));
            assert.ok(!codes.includes('FROM-SETTINGS'));
        } finally {
            await ws.cleanup();
        }
    });

    test('DITACRAFT_SETTINGS_FILE selects another settings file', async () => {
        const ws = await createTestWorkspace({
            files: {
                'config/ditacraft.json': '{ "ditacraft.customRulesFile": "rules/custom.json" }',
                'rules/custom.json': rulesFile('PROJECT-003'),
                'draft.dita': DRAFT_TOPIC,
            },
            env: { DITACRAFT_SETTINGS_FILE: 'config/ditacraft.json' },
        });
        try {
            assert.ok((await codesOf(ws, 'draft.dita')).includes('PROJECT-003'));
        } finally {
            await ws.cleanup();
        }
    });

    suite('xmlCatalogPath', () => {
        // A project document type shell, known only to the project's catalog.
        const catalogFiles = {
            'catalog.xml': [
                '<?xml version="1.0" encoding="UTF-8"?>',
                '<catalog xmlns="urn:oasis:names:tc:entity:xmlns:xml:catalog" prefer="public">',
                '  <public publicId="-//TEST//DTD Mini Topic//EN" uri="dtd/mini.dtd"/>',
                '</catalog>',
            ].join('\n'),
            'dtd/mini.dtd': [
                '<!ELEMENT topic (title, body?)>',
                '<!ATTLIST topic id ID #REQUIRED class CDATA "- topic/topic ">',
                '<!ELEMENT title (#PCDATA)>',
                '<!ELEMENT body (p*)>',
                '<!ELEMENT p (#PCDATA)>',
            ].join('\n'),
        };
        const miniTopic = (body: string) => [
            '<?xml version="1.0" encoding="UTF-8"?>',
            '<!DOCTYPE topic PUBLIC "-//TEST//DTD Mini Topic//EN" "not-here/mini.dtd">',
            '<topic id="t">',
            '  <title>T</title>',
            `  <body>${body}</body>`,
            '</topic>',
        ].join('\n');
        const dtdErrors = async (ws: TestWorkspace, uri: string) => {
            const result = await ws.callTool('dita_validate', { uri }) as { diagnostics: Array<{ code: string; message: string }> };
            return result.diagnostics.filter((d) => d.code === 'DITA-DTD-001').map((d) => d.message);
        };

        test('DITACRAFT_XML_CATALOG resolves a project document type shell', async () => {
            const ws = await createTestWorkspace({
                files: {
                    ...catalogFiles,
                    'valid.dita': miniTopic('<p>Text.</p>'),
                    'invalid.dita': miniTopic('<ul><li>Not in the shell</li></ul>'),
                },
                env: { DITACRAFT_XML_CATALOG: 'catalog.xml' },
            });
            try {
                assert.deepStrictEqual(await dtdErrors(ws, 'valid.dita'), []);
                const errors = await dtdErrors(ws, 'invalid.dita');
                assert.strictEqual(errors.length, 1);
                assert.ok(errors[0].includes('"li"'), errors[0]);
            } finally {
                await ws.cleanup();
            }
        });

        test('ditacraft.xmlCatalogPath from the settings file resolves it too', async () => {
            const ws = await createTestWorkspace({
                files: {
                    ...catalogFiles,
                    '.vscode/settings.json': '{ "ditacraft.xmlCatalogPath": "catalog.xml" }',
                    'valid.dita': miniTopic('<p>Text.</p>'),
                },
            });
            try {
                assert.deepStrictEqual(await dtdErrors(ws, 'valid.dita'), []);
            } finally {
                await ws.cleanup();
            }
        });

        test('without the catalog the shell is not found', async () => {
            const ws = await createTestWorkspace({
                files: { ...catalogFiles, 'valid.dita': miniTopic('<p>Text.</p>') },
            });
            try {
                const errors = await dtdErrors(ws, 'valid.dita');
                assert.strictEqual(errors.length, 1, 'the test shell must not resolve through the bundled catalog');
            } finally {
                await ws.cleanup();
            }
        });
    });

    test('severity overrides from the settings file apply', async () => {
        const ws = await createTestWorkspace({
            files: {
                '.vscode/settings.json': JSON.stringify({
                    'ditacraft.customRulesFile': 'rules/custom.json',
                    'ditacraft.validationSeverityOverrides': { 'PROJECT-004': 'off' },
                }),
                'rules/custom.json': rulesFile('PROJECT-004'),
                'draft.dita': DRAFT_TOPIC,
            },
        });
        try {
            assert.ok(!(await codesOf(ws, 'draft.dita')).includes('PROJECT-004'));
        } finally {
            await ws.cleanup();
        }
    });
});

suite('MCP server — workspace path', () => {

    test('accepts a WORKSPACE relative to its working directory', async () => {
        const ws = await createTestWorkspace({
            relativeWorkspace: true,
            files: { 'topic.dita': TOPIC_VALID },
        });
        try {
            const result = await ws.callTool('dita_validate', { uri: 'topic.dita' }) as Record<string, unknown>;
            assert.strictEqual(result.error, undefined, `unexpected error: ${String(result.error)}`);
            assert.strictEqual(result.isValid, true);
        } finally {
            await ws.cleanup();
        }
    });
});
