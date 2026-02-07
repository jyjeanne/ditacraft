import * as assert from 'assert';
import { handleCompletion } from '../src/features/completion';
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
        test('after < inside topic body returns child elements', () => {
            const content = '<topic id="t1"><body><</body></topic>';
            // < is at offset 21; cursor must be after < (offset 22) for context detection
            const items = complete(content, 0, 22);
            assert.ok(items.length > 0);
            const labels = items.map(i => i.label);
            assert.ok(labels.includes('p'), 'should include <p>');
            assert.ok(labels.includes('section'), 'should include <section>');
        });

        test('after < inside topic returns topic children', () => {
            const content = '<topic id="t1"><</topic>';
            const items = complete(content, 0, 16);
            assert.ok(items.length > 0);
            const labels = items.map(i => i.label);
            assert.ok(labels.includes('title'), 'should include <title>');
            assert.ok(labels.includes('body'), 'should include <body>');
        });

        test('unknown parent returns empty', () => {
            const content = '<unknownelement><</unknownelement>';
            const items = complete(content, 0, 18);
            assert.strictEqual(items.length, 0);
        });
    });

    suite('Attribute completions', () => {
        test('inside opening tag after space returns attributes', () => {
            const content = '<topic >';
            const items = complete(content, 0, 7);
            assert.ok(items.length > 0);
            const labels = items.map(i => i.label);
            assert.ok(labels.includes('id'), 'should include id');
        });

        test('inside topicref returns topicref-specific attributes', () => {
            const content = '<topicref >';
            const items = complete(content, 0, 10);
            assert.ok(items.length > 0);
            const labels = items.map(i => i.label);
            assert.ok(labels.includes('href'), 'should include href');
        });
    });

    suite('Attribute value completions', () => {
        test('inside type="" returns type values', () => {
            const content = '<note type="">';
            // cursor inside the quotes at position 12
            const items = complete(content, 0, 12);
            assert.ok(items.length > 0);
            const labels = items.map(i => i.label);
            assert.ok(labels.includes('note'), 'should include note type');
            assert.ok(labels.includes('warning'), 'should include warning type');
        });

        test('inside scope="" returns scope values', () => {
            const content = '<xref scope="">';
            const items = complete(content, 0, 13);
            assert.ok(items.length > 0);
            const labels = items.map(i => i.label);
            assert.ok(labels.includes('local'));
            assert.ok(labels.includes('external'));
        });

        test('unknown attribute returns empty', () => {
            const content = '<topic unknownattr="">';
            const items = complete(content, 0, 20);
            assert.strictEqual(items.length, 0);
        });
    });

    suite('No completions', () => {
        test('in text content returns empty', () => {
            const content = '<p>text here</p>';
            const items = complete(content, 0, 6);
            assert.strictEqual(items.length, 0);
        });

        test('in closing tag returns empty', () => {
            const content = '<topic></topic>';
            const items = complete(content, 0, 9);
            assert.strictEqual(items.length, 0);
        });

        test('document not found returns empty', () => {
            const docs = createDocs(); // no documents
            const items = handleCompletion(
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
        test('element completion uses snippet format', () => {
            const content = '<topic id="t1"><';
            const items = complete(content, 0, 16);
            assert.ok(items.length > 0);
            // Verify snippet format: insertText should contain ${1} and closing tag
            const titleItem = items.find(i => i.label === 'title');
            assert.ok(titleItem);
            assert.ok(titleItem.insertText?.includes('</title>'));
        });

        test('attribute completion uses snippet format', () => {
            const content = '<topic >';
            const items = complete(content, 0, 7);
            const idItem = items.find(i => i.label === 'id');
            assert.ok(idItem);
            assert.ok(idItem.insertText?.includes('="'));
        });
    });
});
