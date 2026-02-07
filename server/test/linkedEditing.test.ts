import * as assert from 'assert';
import { handleLinkedEditingRange } from '../src/features/linkedEditing';
import { createDoc, createDocs, TEST_URI } from './helper';

function linked(content: string, line: number, character: number) {
    const doc = createDoc(content);
    const docs = createDocs(doc);
    return handleLinkedEditingRange(
        {
            textDocument: { uri: TEST_URI },
            position: { line, character },
        },
        docs
    );
}

suite('handleLinkedEditingRange', () => {
    suite('Opening tag cursor', () => {
        test('cursor on opening tag name returns both ranges', () => {
            const content = '<topic id="t1"><title>T</title></topic>';
            // cursor on "topic" in <topic — offset 1-5
            const result = linked(content, 0, 2);
            assert.ok(result);
            assert.strictEqual(result.ranges.length, 2);
        });

        test('cursor on <title> opening returns open+close ranges', () => {
            const content = '<topic id="t1"><title>T</title></topic>';
            // <title> starts at offset 15, name at 16-20
            const result = linked(content, 0, 17);
            assert.ok(result);
            assert.strictEqual(result.ranges.length, 2);
        });

        test('ranges include wordPattern', () => {
            const content = '<topic id="t1"><title>T</title></topic>';
            const result = linked(content, 0, 2);
            assert.ok(result);
            assert.ok(result.wordPattern);
        });
    });

    suite('Closing tag cursor', () => {
        test('cursor on closing tag name returns both ranges', () => {
            const content = '<topic id="t1"><title>T</title></topic>';
            // </topic> starts at offset 31, name "topic" at 33-37
            const result = linked(content, 0, 34);
            assert.ok(result);
            assert.strictEqual(result.ranges.length, 2);
        });

        test('cursor on </title> returns open+close ranges', () => {
            const content = '<topic id="t1"><title>T</title></topic>';
            // </title> starts at offset 22, name at 24-28
            const result = linked(content, 0, 25);
            assert.ok(result);
            assert.strictEqual(result.ranges.length, 2);
        });
    });

    suite('Self-closing tags', () => {
        test('cursor on self-closing tag returns null', () => {
            const content = '<topicref href="file.dita"/>';
            const result = linked(content, 0, 3);
            assert.strictEqual(result, null);
        });
    });

    suite('Non-tag positions', () => {
        test('cursor in text content returns null', () => {
            const content = '<p>some text here</p>';
            const result = linked(content, 0, 8);
            assert.strictEqual(result, null);
        });

        test('cursor in attribute value returns null', () => {
            const content = '<topic id="myid"><title>T</title></topic>';
            const result = linked(content, 0, 13); // inside "myid"
            assert.strictEqual(result, null);
        });

        test('cursor in comment returns null', () => {
            const content = '<!-- comment --><topic id="t1"><title>T</title></topic>';
            const result = linked(content, 0, 5);
            assert.strictEqual(result, null);
        });

        test('cursor in processing instruction returns null', () => {
            const content = '<?xml version="1.0"?><topic id="t1"><title>T</title></topic>';
            const result = linked(content, 0, 3);
            assert.strictEqual(result, null);
        });
    });

    suite('Nested same-name tags', () => {
        test('cursor on outer opening tag matches outer closing', () => {
            const content = '<div><div>inner</div></div>';
            // outer <div> — name at offset 1-3
            const result = linked(content, 0, 2);
            assert.ok(result);
            assert.strictEqual(result.ranges.length, 2);
            // outer </div> starts at offset 21, name "div" at 23-25
            const doc = createDoc(content);
            const endRange = result.ranges[1];
            const endOffset = doc.offsetAt(endRange.start);
            assert.strictEqual(endOffset, 23); // "</div>" at end, name starts at 23
        });

        test('cursor on inner opening tag matches inner closing', () => {
            const content = '<div><div>inner</div></div>';
            // inner <div> — name at offset 6-8
            const result = linked(content, 0, 7);
            assert.ok(result);
            assert.strictEqual(result.ranges.length, 2);
            const doc = createDoc(content);
            const endRange = result.ranges[1];
            const endOffset = doc.offsetAt(endRange.start);
            assert.strictEqual(endOffset, 17); // inner "</div>" name at 17
        });

        test('cursor on inner closing tag matches inner opening', () => {
            const content = '<div><div>inner</div></div>';
            // inner </div> — name at offset 17-19
            const result = linked(content, 0, 18);
            assert.ok(result);
            assert.strictEqual(result.ranges.length, 2);
            const doc = createDoc(content);
            const firstRange = result.ranges[1]; // the matched opening tag
            const startOffset = doc.offsetAt(firstRange.start);
            assert.strictEqual(startOffset, 6); // inner <div> name at 6
        });
    });

    suite('Edge cases', () => {
        test('document not found returns null', () => {
            const docs = createDocs(); // empty
            const result = handleLinkedEditingRange(
                {
                    textDocument: { uri: 'file:///nonexistent.dita' },
                    position: { line: 0, character: 0 },
                },
                docs
            );
            assert.strictEqual(result, null);
        });

        test('cursor at tag name boundary (start)', () => {
            const content = '<topic id="t1"><title>T</title></topic>';
            // cursor at start of "topic" name (offset 1)
            const result = linked(content, 0, 1);
            assert.ok(result);
            assert.strictEqual(result.ranges.length, 2);
        });

        test('cursor at tag name boundary (end)', () => {
            const content = '<topic id="t1"><title>T</title></topic>';
            // cursor at end of "topic" name (offset 6)
            // Implementation allows offset === nameEnd (checks offset > nameEnd)
            const result = linked(content, 0, 6);
            assert.ok(result);
            assert.strictEqual(result.ranges.length, 2);
        });

        test('empty document returns null', () => {
            const result = linked('', 0, 0);
            assert.strictEqual(result, null);
        });

        test('tag with hyphenated name', () => {
            const content = '<related-links><link href="a.dita"/></related-links>';
            const result = linked(content, 0, 5); // on "related-links"
            assert.ok(result);
            assert.strictEqual(result.ranges.length, 2);
        });
    });
});
