import * as assert from 'assert';
import {
    parseReference,
    getTargetId,
    findReferenceAtOffset,
    findIdAtOffset,
    findReferencesToId,
    findElementByIdOffset,
    findKeyAtOffset,
    findReferencesToKey,
    countKeyDefinitionOccurrences,
    extractKeyPart,
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

    suite('findKeyAtOffset', () => {
        test('cursor inside a single-key "keys" value', () => {
            const text = '<keydef keys="mykey" href="target.dita"/>';
            const offset = 16; // inside "mykey"
            const result = findKeyAtOffset(text, offset);
            assert.ok(result);
            assert.strictEqual(result.key, 'mykey');
        });

        test('cursor on one token of a multi-key "keys" value returns just that token', () => {
            const text = '<keydef keys="alpha beta gamma" href="target.dita"/>';
            const offset = text.indexOf('beta') + 1;
            const result = findKeyAtOffset(text, offset);
            assert.ok(result);
            assert.strictEqual(result.key, 'beta');
            assert.strictEqual(text.slice(result.valueStart, result.valueEnd), 'beta');
        });

        test('cursor exactly at the end of a token still matches it', () => {
            const text = '<keydef keys="alpha beta" href="target.dita"/>';
            const offset = text.indexOf('alpha') + 'alpha'.length; // right after "alpha", before the space
            const result = findKeyAtOffset(text, offset);
            assert.ok(result);
            assert.strictEqual(result.key, 'alpha');
        });

        test('cursor in the whitespace between two tokens returns null', () => {
            // Two-space gap so there's a position that isn't the boundary of
            // either adjacent token (a single-space gap has none — position
            // `tokenEnd` of "alpha" and `tokenStart` of "beta" would coincide).
            const text = '<keydef keys="alpha  beta" href="target.dita"/>';
            const offset = text.indexOf('alpha') + 'alpha'.length + 1; // the middle of the two-space gap
            const result = findKeyAtOffset(text, offset);
            assert.strictEqual(result, null);
        });

        test('cursor on non-"keys" attribute returns null', () => {
            const text = '<keydef keys="mykey" href="target.dita"/>';
            const offset = text.indexOf('target.dita');
            const result = findKeyAtOffset(text, offset);
            assert.strictEqual(result, null);
        });

        test('cursor outside quotes returns null', () => {
            const text = '<keydef keys="mykey"/>';
            const offset = 1; // on "k" of keydef
            const result = findKeyAtOffset(text, offset);
            assert.strictEqual(result, null);
        });

        test('single-quoted "keys" attribute is supported', () => {
            const text = "<keydef keys='mykey' href='target.dita'/>";
            const offset = text.indexOf('mykey') + 1;
            const result = findKeyAtOffset(text, offset);
            assert.ok(result);
            assert.strictEqual(result.key, 'mykey');
        });

        test('tolerates a newline around "=" (regression)', () => {
            // Matches the whitespace-tolerant anchor regex added alongside
            // this in KeySpaceService.extractKeyDefinitionsFromElements —
            // a cursor placed in such a value used to fail to match here
            // even though the key is correctly registered in the key space.
            const text = '<keydef keys\n="mykey" href="target.dita"/>';
            const offset = text.indexOf('mykey') + 1;
            const result = findKeyAtOffset(text, offset);
            assert.ok(result);
            assert.strictEqual(result.key, 'mykey');
        });

        test('tolerates a tab around "=" (regression)', () => {
            const text = '<keydef keys\t=\t"mykey" href="target.dita"/>';
            const offset = text.indexOf('mykey') + 1;
            const result = findKeyAtOffset(text, offset);
            assert.ok(result);
            assert.strictEqual(result.key, 'mykey');
        });
    });

    suite('extractKeyPart', () => {
        test('keyref-shaped value (no slash) is returned unchanged', () => {
            assert.strictEqual(extractKeyPart('mykey'), 'mykey');
        });

        test('conkeyref-shaped value returns the part before the slash', () => {
            assert.strictEqual(extractKeyPart('mykey/elem1'), 'mykey');
        });
    });

    suite('findReferencesToKey', () => {
        test('finds a matching keyref', () => {
            const text = '<xref keyref="mykey"/>';
            const refs = findReferencesToKey(text, 'mykey');
            assert.strictEqual(refs.length, 1);
            assert.strictEqual(refs[0].type, 'keyref');
        });

        test('finds a matching conkeyref by its key-name prefix', () => {
            const text = '<p conkeyref="mykey/elem1"/>';
            const refs = findReferencesToKey(text, 'mykey');
            assert.strictEqual(refs.length, 1);
            assert.strictEqual(refs[0].type, 'conkeyref');
            assert.strictEqual(refs[0].value, 'mykey/elem1');
        });

        test('href and conref never match (they never carry a key name)', () => {
            const text = '<xref href="mykey.dita"/><p conref="#mykey/e1"/>';
            const refs = findReferencesToKey(text, 'mykey');
            assert.strictEqual(refs.length, 0);
        });

        test('an indirect keyref on a keydef element is found like any other keyref', () => {
            const text = '<keydef keys="alias" keyref="mykey"/>';
            const refs = findReferencesToKey(text, 'mykey');
            assert.strictEqual(refs.length, 1);
            assert.strictEqual(refs[0].type, 'keyref');
        });

        test('no matches for an unrelated key name', () => {
            const text = '<xref keyref="otherkey"/>';
            const refs = findReferencesToKey(text, 'mykey');
            assert.strictEqual(refs.length, 0);
        });

        test('multiple matches across keyref and conkeyref', () => {
            const text = '<xref keyref="mykey"/> <p conkeyref="mykey/e1"/>';
            const refs = findReferencesToKey(text, 'mykey');
            assert.strictEqual(refs.length, 2);
        });

        test('returns correct value offsets', () => {
            const text = '<p conkeyref="mykey/elem1"/>';
            const refs = findReferencesToKey(text, 'mykey');
            assert.strictEqual(refs.length, 1);
            assert.strictEqual(text.slice(refs[0].valueStart, refs[0].valueEnd), 'mykey/elem1');
        });
    });

    suite('countKeyDefinitionOccurrences', () => {
        test('counts a single-key definition', () => {
            const text = '<keydef keys="mykey" href="a.dita"/>';
            assert.strictEqual(countKeyDefinitionOccurrences(text, 'mykey'), 1);
        });

        test('counts a key inside a multi-key attribute the same as a single-key one', () => {
            const text = '<keydef keys="alpha mykey gamma" href="a.dita"/>';
            assert.strictEqual(countKeyDefinitionOccurrences(text, 'mykey'), 1);
        });

        test('counts two separate definitions of the same key name', () => {
            const text =
                '<topicref keyscope="a" keys="mykey" href="a.dita"/>' +
                '<topicref keyscope="b" keys="mykey" href="b.dita"/>';
            assert.strictEqual(countKeyDefinitionOccurrences(text, 'mykey'), 2);
        });

        test('returns 0 when the key is never defined', () => {
            const text = '<keydef keys="otherkey" href="a.dita"/>';
            assert.strictEqual(countKeyDefinitionOccurrences(text, 'mykey'), 0);
        });

        test('does not match a substring of a different key token', () => {
            const text = '<keydef keys="mykey-extended" href="a.dita"/>';
            assert.strictEqual(countKeyDefinitionOccurrences(text, 'mykey'), 0);
        });

        test('does not count keyref/conkeyref usages, only keys= definitions', () => {
            const text = '<keydef keys="mykey" href="a.dita"/><xref keyref="mykey"/>';
            assert.strictEqual(countKeyDefinitionOccurrences(text, 'mykey'), 1);
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
