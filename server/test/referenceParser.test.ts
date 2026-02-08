import * as assert from 'assert';
import {
    parseReference,
    getTargetId,
    findReferenceAtOffset,
    findIdAtOffset,
    findReferencesToId,
    findElementByIdOffset,
} from '../src/utils/referenceParser';

suite('referenceParser', () => {
    suite('parseReference', () => {
        test('file + fragment', () => {
            const r = parseReference('file.dita#topicid/elementid');
            assert.strictEqual(r.filePath, 'file.dita');
            assert.strictEqual(r.fragment, 'topicid/elementid');
        });

        test('fragment only', () => {
            const r = parseReference('#topicid/elementid');
            assert.strictEqual(r.filePath, '');
            assert.strictEqual(r.fragment, 'topicid/elementid');
        });

        test('file only (no hash)', () => {
            const r = parseReference('file.dita');
            assert.strictEqual(r.filePath, 'file.dita');
            assert.strictEqual(r.fragment, '');
        });

        test('empty string', () => {
            const r = parseReference('');
            assert.strictEqual(r.filePath, '');
            assert.strictEqual(r.fragment, '');
        });

        test('relative path + fragment', () => {
            const r = parseReference('../topics/intro.dita#intro');
            assert.strictEqual(r.filePath, '../topics/intro.dita');
            assert.strictEqual(r.fragment, 'intro');
        });

        test('hash at end (empty fragment)', () => {
            const r = parseReference('file.dita#');
            assert.strictEqual(r.filePath, 'file.dita');
            assert.strictEqual(r.fragment, '');
        });
    });

    suite('getTargetId', () => {
        test('topicid/elementid format', () => {
            assert.strictEqual(getTargetId('topicid/elementid'), 'elementid');
        });

        test('simple id (no slash)', () => {
            assert.strictEqual(getTargetId('myid'), 'myid');
        });

        test('empty string', () => {
            assert.strictEqual(getTargetId(''), '');
        });

        test('multiple slashes', () => {
            assert.strictEqual(getTargetId('a/b/c'), 'b/c');
        });
    });

    suite('findReferenceAtOffset', () => {
        test('cursor inside href value', () => {
            const text = '<topicref href="file.dita#topic1"/>';
            const offset = 20; // inside "file.dita#topic1"
            const result = findReferenceAtOffset(text, offset);
            assert.ok(result);
            assert.strictEqual(result.type, 'href');
            assert.strictEqual(result.value, 'file.dita#topic1');
        });

        test('cursor inside conref value', () => {
            const text = '<p conref="other.dita#topic/para1"/>';
            const offset = 15; // inside value
            const result = findReferenceAtOffset(text, offset);
            assert.ok(result);
            assert.strictEqual(result.type, 'conref');
            assert.strictEqual(result.value, 'other.dita#topic/para1');
        });

        test('cursor inside keyref value', () => {
            const text = '<xref keyref="mykey"/>';
            const offset = 16; // inside "mykey"
            const result = findReferenceAtOffset(text, offset);
            assert.ok(result);
            assert.strictEqual(result.type, 'keyref');
            assert.strictEqual(result.value, 'mykey');
        });

        test('cursor inside conkeyref value', () => {
            const text = '<p conkeyref="keyname/elemid"/>';
            const offset = 18; // inside value
            const result = findReferenceAtOffset(text, offset);
            assert.ok(result);
            assert.strictEqual(result.type, 'conkeyref');
            assert.strictEqual(result.value, 'keyname/elemid');
        });

        test('cursor on non-reference attribute returns null', () => {
            const text = '<topic id="myid">';
            const offset = 13; // inside "myid"
            const result = findReferenceAtOffset(text, offset);
            assert.strictEqual(result, null);
        });

        test('cursor outside attribute value returns null', () => {
            const text = '<topicref href="file.dita"/>';
            const offset = 1; // on "t" of topicref
            const result = findReferenceAtOffset(text, offset);
            assert.strictEqual(result, null);
        });

        test('cursor in text content returns null', () => {
            const text = '<p>hello world</p>';
            const offset = 6; // in "hello"
            const result = findReferenceAtOffset(text, offset);
            assert.strictEqual(result, null);
        });
    });

    suite('findIdAtOffset', () => {
        test('cursor inside id value', () => {
            const text = '<topic id="my_topic">';
            const offset = 14; // inside "my_topic"
            const result = findIdAtOffset(text, offset);
            assert.ok(result);
            assert.strictEqual(result.id, 'my_topic');
        });

        test('cursor on non-id attribute returns null', () => {
            const text = '<topic class="foo">';
            const offset = 16; // inside "foo"
            const result = findIdAtOffset(text, offset);
            assert.strictEqual(result, null);
        });

        test('cursor outside quotes returns null', () => {
            const text = '<topic id="myid">';
            const offset = 1; // on "t" of topic
            const result = findIdAtOffset(text, offset);
            assert.strictEqual(result, null);
        });

        test('returns correct value range', () => {
            const text = '<topic id="my_topic">';
            const offset = 14;
            const result = findIdAtOffset(text, offset);
            assert.ok(result);
            assert.strictEqual(text.slice(result.valueStart, result.valueEnd), 'my_topic');
        });
    });

    suite('findReferencesToId', () => {
        test('finds href with matching fragment', () => {
            const text = '<xref href="file.dita#topic1/elem1"/>';
            const refs = findReferencesToId(text, 'elem1');
            assert.strictEqual(refs.length, 1);
            assert.strictEqual(refs[0].type, 'href');
        });

        test('finds conref with matching fragment', () => {
            const text = '<p conref="#topic1/para1"/>';
            const refs = findReferencesToId(text, 'para1');
            assert.strictEqual(refs.length, 1);
            assert.strictEqual(refs[0].type, 'conref');
        });

        test('finds conkeyref with matching element id', () => {
            const text = '<p conkeyref="keyname/para1"/>';
            const refs = findReferencesToId(text, 'para1');
            assert.strictEqual(refs.length, 1);
            assert.strictEqual(refs[0].type, 'conkeyref');
        });

        test('keyref does not match (keyrefs are key names)', () => {
            const text = '<xref keyref="mykey"/>';
            const refs = findReferencesToId(text, 'mykey');
            assert.strictEqual(refs.length, 0);
        });

        test('no matches', () => {
            const text = '<xref href="file.dita#topic1/elem1"/>';
            const refs = findReferencesToId(text, 'nonexistent');
            assert.strictEqual(refs.length, 0);
        });

        test('multiple matches', () => {
            const text = '<xref href="#t/e1"/> <p conref="#t/e1"/>';
            const refs = findReferencesToId(text, 'e1');
            assert.strictEqual(refs.length, 2);
        });

        test('returns correct value offsets', () => {
            const text = '<xref href="file.dita#topic/elem1"/>';
            const refs = findReferencesToId(text, 'elem1');
            assert.strictEqual(refs.length, 1);
            assert.strictEqual(text.slice(refs[0].valueStart, refs[0].valueEnd), 'file.dita#topic/elem1');
        });
    });

    suite('findElementByIdOffset', () => {
        test('finds element with matching id', () => {
            const text = '<topic id="t1"><title>Test</title></topic>';
            const offset = findElementByIdOffset(text, 't1');
            assert.strictEqual(offset, 0); // at '<topic'
        });

        test('returns -1 for non-existent id', () => {
            const text = '<topic id="t1"><title>Test</title></topic>';
            assert.strictEqual(findElementByIdOffset(text, 'nonexistent'), -1);
        });

        test('ignores ids inside comments', () => {
            const text = '<!-- <p id="hidden"/> -->\n<p id="visible"/>';
            const offset = findElementByIdOffset(text, 'hidden');
            assert.strictEqual(offset, -1);
        });

        test('ignores ids inside CDATA', () => {
            const text = '<![CDATA[<p id="hidden"/>]]>\n<p id="visible"/>';
            const offset = findElementByIdOffset(text, 'hidden');
            assert.strictEqual(offset, -1);
        });

        test('finds first occurrence for duplicate ids', () => {
            const text = '<p id="dup">first</p><p id="dup">second</p>';
            const offset = findElementByIdOffset(text, 'dup');
            assert.strictEqual(offset, 0); // first <p
        });

        test('handles id with special regex characters', () => {
            const text = '<p id="my.id">text</p>';
            const offset = findElementByIdOffset(text, 'my.id');
            assert.strictEqual(offset, 0);
        });
    });
});
