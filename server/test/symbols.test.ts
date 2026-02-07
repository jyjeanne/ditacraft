import * as assert from 'assert';
import { handleDocumentSymbol } from '../src/features/symbols';
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
