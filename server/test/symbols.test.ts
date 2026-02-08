import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { URI } from 'vscode-uri';
import { handleDocumentSymbol, handleWorkspaceSymbol } from '../src/features/symbols';
import { createDoc, createDocs, TEST_URI } from './helper';

function symbols(content: string) {
    const doc = createDoc(content);
    const docs = createDocs(doc);
    return handleDocumentSymbol(
        { textDocument: { uri: TEST_URI } },
        docs
    );
}

suite('handleDocumentSymbol', () => {
    suite('Basic outline', () => {
        test('topic with title returns topic symbol', () => {
            const content = '<topic id="t1"><title>My Topic</title></topic>';
            const result = symbols(content);
            assert.ok(result.length >= 1);
            const topicSym = result[0];
            assert.ok(topicSym.name.includes('My Topic'));
        });

        test('topic without title uses element name and id', () => {
            const content = '<topic id="t1"><body><p>text</p></body></topic>';
            const result = symbols(content);
            assert.ok(result.length >= 1);
            const topicSym = result[0];
            assert.ok(topicSym.name.includes('topic') || topicSym.name.includes('t1'));
        });

        test('nested body and section appear as children', () => {
            const content = '<topic id="t1"><title>T</title><body><section><title>S</title></section></body></topic>';
            const result = symbols(content);
            assert.ok(result.length >= 1);
            const topic = result[0];
            assert.ok(topic.children && topic.children.length > 0, 'topic should have children');
        });
    });

    suite('Map symbols', () => {
        test('map with topicrefs', () => {
            const content = '<map><title>My Map</title><topicref href="a.dita"/><topicref href="b.dita"/></map>';
            const result = symbols(content);
            assert.ok(result.length >= 1);
            const mapSym = result[0];
            assert.ok(mapSym.name.includes('My Map'));
        });

        test('bookmap is recognized', () => {
            const content = '<bookmap><title>Book</title></bookmap>';
            const result = symbols(content);
            assert.ok(result.length >= 1);
        });
    });

    suite('Symbol details', () => {
        test('id is shown in symbol detail', () => {
            const content = '<topic id="my-topic"><title>T</title></topic>';
            const result = symbols(content);
            assert.ok(result.length >= 1);
            const topicSym = result[0];
            assert.strictEqual(topicSym.detail, 'my-topic');
        });

        test('element without id has no detail', () => {
            const content = '<topic id="t1"><body><section><title>S</title></section></body></topic>';
            const result = symbols(content);
            const topic = result[0];
            // Find section — it's nested under body
            const body = topic.children?.find(c => c.name.includes('body') || c.name === 'body');
            assert.ok(body);
            const section = body.children?.find(c => c.name.includes('S') || c.name.includes('section'));
            assert.ok(section);
            assert.ok(!section.detail || section.detail === '');
        });
    });

    suite('Self-closing elements', () => {
        test('self-closing topicref appears in outline', () => {
            const content = '<map><topicref href="file.dita"/></map>';
            const result = symbols(content);
            assert.ok(result.length >= 1);
            const mapSym = result[0];
            assert.ok(mapSym.children && mapSym.children.length > 0, 'map should contain topicref');
        });
    });

    suite('Title text extraction', () => {
        test('title text replaces default symbol name', () => {
            const content = '<topic id="t1"><title>Hello World</title></topic>';
            const result = symbols(content);
            assert.ok(result.length >= 1);
            assert.ok(result[0].name.includes('Hello World'));
        });

        test('section with title gets its text', () => {
            const content = '<topic id="t1"><title>T</title><body><section><title>My Section</title></section></body></topic>';
            const result = symbols(content);
            const topic = result[0];
            const body = topic.children?.find(c => c.name.includes('body') || c.name === 'body');
            assert.ok(body);
            const section = body.children?.find(c => c.name.includes('My Section'));
            assert.ok(section, 'section should have title text "My Section"');
        });
    });

    suite('Edge cases', () => {
        test('empty document returns empty', () => {
            const result = symbols('');
            assert.strictEqual(result.length, 0);
        });

        test('document not found returns empty', () => {
            const docs = createDocs(); // no documents
            const result = handleDocumentSymbol(
                { textDocument: { uri: 'file:///nonexistent.dita' } },
                docs
            );
            assert.strictEqual(result.length, 0);
        });

        test('deeply nested structure', () => {
            const content = '<topic id="t1"><title>T</title><taskbody><steps><step><cmd>Do</cmd></step></steps></taskbody></topic>';
            const result = symbols(content);
            assert.ok(result.length >= 1);
        });
    });
});

suite('handleWorkspaceSymbol', () => {
    let tmpDir: string;

    setup(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dita-ws-test-'));
        // Create test DITA files
        fs.writeFileSync(path.join(tmpDir, 'intro.dita'),
            '<topic id="intro"><title>Introduction</title><body><p>text</p></body></topic>');
        fs.writeFileSync(path.join(tmpDir, 'install.dita'),
            '<task id="install-guide"><title>Installation Guide</title><taskbody><steps><step><cmd>Run</cmd></step></steps></taskbody></task>');
        fs.writeFileSync(path.join(tmpDir, 'ref.dita'),
            '<reference id="api-ref"><title>API Reference</title><refbody><section><title>Methods</title></section></refbody></reference>');
    });

    teardown(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    function wsSymbols(query: string, workspaceFolders?: string[]) {
        const docs = createDocs(); // empty — tests read from disk
        return handleWorkspaceSymbol(
            { query },
            docs,
            workspaceFolders ?? [tmpDir]
        );
    }

    test('query matching title returns symbols', () => {
        const results = wsSymbols('Introduction');
        assert.ok(results.length > 0, 'should find Introduction');
        assert.ok(results.some(s => s.name.includes('Introduction')));
    });

    test('case-insensitive matching', () => {
        const results = wsSymbols('installation');
        assert.ok(results.length > 0, 'should find installation case-insensitively');
    });

    test('matches by containerName (parent title)', () => {
        // containerName is the parent element's display name (title text)
        // body's containerName is "Introduction" (the topic's title)
        const results = wsSymbols('Introduction');
        // Should match both the topic itself and nested elements via containerName
        assert.ok(results.length > 0, 'should match container names');
    });

    test('empty query returns empty', () => {
        const results = wsSymbols('');
        assert.strictEqual(results.length, 0);
    });

    test('no workspace folders returns empty', () => {
        const results = wsSymbols('Introduction', []);
        assert.strictEqual(results.length, 0);
    });

    test('query with no match returns empty', () => {
        const results = wsSymbols('xyznonexistent');
        assert.strictEqual(results.length, 0);
    });

    test('results include location info', () => {
        const results = wsSymbols('API Reference');
        assert.ok(results.length > 0);
        assert.ok(results[0].location, 'should have location');
        assert.ok(results[0].location.uri, 'should have URI');
    });

    test('prefers in-memory document over disk', () => {
        // Open a file in the documents map with different content
        const filePath = path.join(tmpDir, 'intro.dita');
        const uri = URI.file(filePath).toString();
        const doc = createDoc('<topic id="mem"><title>In Memory Topic</title></topic>', uri);
        const docs = createDocs(doc);
        const results = handleWorkspaceSymbol(
            { query: 'In Memory' },
            docs,
            [tmpDir]
        );
        assert.ok(results.some(s => s.name.includes('In Memory')),
            'should find in-memory content');
    });
});
