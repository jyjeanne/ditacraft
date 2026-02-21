import * as assert from 'assert';
import {
    tokenize,
    TokenType,
    Token,
    findAttributeAtOffset,
    findContextAtOffset,
} from '../src/utils/xmlTokenizer';

/** Collect all tokens from the generator. */
function allTokens(input: string): Token[] {
    return [...tokenize(input)];
}

/** Get token types only (ignoring EOF). */
function tokenTypes(input: string): TokenType[] {
    return allTokens(input).filter(t => t.type !== TokenType.EOF).map(t => t.type);
}

/** Find the first token of a given type. */
function firstOf(input: string, type: TokenType): Token | undefined {
    return allTokens(input).find(t => t.type === type);
}

suite('xmlTokenizer', () => {
    suite('basic elements', () => {
        test('simple opening tag', () => {
            const tokens = allTokens('<topic>');
            const types = tokens.map(t => t.type);
            assert.deepStrictEqual(types, [
                TokenType.ELEMENT_START,
                TokenType.ELEMENT_NAME_START,
                TokenType.ELEMENT_END,
                TokenType.EOF,
            ]);
            assert.strictEqual(tokens[1].text, 'topic');
        });

        test('closing tag', () => {
            const tokens = allTokens('</topic>');
            const types = tokens.map(t => t.type);
            assert.deepStrictEqual(types, [
                TokenType.ELEMENT_CLOSE,
                TokenType.ELEMENT_NAME_END,
                TokenType.ELEMENT_END,
                TokenType.EOF,
            ]);
            assert.strictEqual(tokens[1].text, 'topic');
        });

        test('self-closing element', () => {
            const tokens = allTokens('<br/>');
            const types = tokens.map(t => t.type);
            assert.deepStrictEqual(types, [
                TokenType.ELEMENT_START,
                TokenType.ELEMENT_NAME_START,
                TokenType.EMPTY_ELEMENT_END,
                TokenType.EOF,
            ]);
        });

        test('element with text content', () => {
            const tokens = allTokens('<p>Hello World</p>');
            const types = tokens.map(t => t.type);
            assert.deepStrictEqual(types, [
                TokenType.ELEMENT_START,
                TokenType.ELEMENT_NAME_START,
                TokenType.ELEMENT_END,
                TokenType.CHAR_DATA,
                TokenType.ELEMENT_CLOSE,
                TokenType.ELEMENT_NAME_END,
                TokenType.ELEMENT_END,
                TokenType.EOF,
            ]);
            assert.strictEqual(tokens[3].text, 'Hello World');
        });

        test('nested elements', () => {
            const tokens = allTokens('<a><b/></a>');
            const names = tokens.filter(
                t => t.type === TokenType.ELEMENT_NAME_START || t.type === TokenType.ELEMENT_NAME_END
            ).map(t => t.text);
            assert.deepStrictEqual(names, ['a', 'b', 'a']);
        });
    });

    suite('attributes', () => {
        test('single attribute with double quotes', () => {
            const tokens = allTokens('<p id="p1">');
            const types = tokens.map(t => t.type);
            assert.deepStrictEqual(types, [
                TokenType.ELEMENT_START,
                TokenType.ELEMENT_NAME_START,
                TokenType.ATTR_NAME,
                TokenType.EQUALS,
                TokenType.ATTR_QUOTE,
                TokenType.ATTR_VALUE,
                TokenType.ATTR_QUOTE,
                TokenType.ELEMENT_END,
                TokenType.EOF,
            ]);
            const attrName = tokens.find(t => t.type === TokenType.ATTR_NAME);
            const attrValue = tokens.find(t => t.type === TokenType.ATTR_VALUE);
            assert.strictEqual(attrName!.text, 'id');
            assert.strictEqual(attrValue!.text, 'p1');
        });

        test('single attribute with single quotes', () => {
            const tokens = allTokens("<p id='p1'>");
            const attrValue = tokens.find(t => t.type === TokenType.ATTR_VALUE);
            assert.strictEqual(attrValue!.text, 'p1');
        });

        test('multiple attributes', () => {
            const tokens = allTokens('<image href="pic.png" alt="A photo"/>');
            const attrNames = tokens.filter(t => t.type === TokenType.ATTR_NAME).map(t => t.text);
            const attrValues = tokens.filter(t => t.type === TokenType.ATTR_VALUE).map(t => t.text);
            assert.deepStrictEqual(attrNames, ['href', 'alt']);
            assert.deepStrictEqual(attrValues, ['pic.png', 'A photo']);
        });

        test('empty attribute value', () => {
            const tokens = allTokens('<p id="">');
            const types = tokens.map(t => t.type);
            // Empty value: ATTR_QUOTE followed immediately by ATTR_QUOTE (no ATTR_VALUE)
            assert.ok(types.includes(TokenType.ATTR_NAME));
            assert.ok(types.includes(TokenType.EQUALS));
            // Two ATTR_QUOTE tokens with no ATTR_VALUE between them
            const quoteIndices = types
                .map((t, i) => t === TokenType.ATTR_QUOTE ? i : -1)
                .filter(i => i >= 0);
            assert.strictEqual(quoteIndices.length, 2);
            assert.strictEqual(quoteIndices[1] - quoteIndices[0], 1);
        });

        test('attribute with namespace prefix', () => {
            const tokens = allTokens('<topic ditaarch:DITAArchVersion="1.3">');
            const attrNames = tokens.filter(t => t.type === TokenType.ATTR_NAME).map(t => t.text);
            assert.ok(attrNames.includes('ditaarch:DITAArchVersion'));
        });
    });

    suite('comments', () => {
        test('simple comment', () => {
            const tokens = allTokens('<!-- hello -->');
            const types = tokens.filter(t => t.type !== TokenType.EOF).map(t => t.type);
            assert.deepStrictEqual(types, [
                TokenType.COMMENT_START,
                TokenType.COMMENT_BODY,
                TokenType.COMMENT_END,
            ]);
            assert.strictEqual(tokens[1].text, ' hello ');
        });

        test('empty comment', () => {
            const tokens = allTokens('<!---->');
            const types = tokens.filter(t => t.type !== TokenType.EOF).map(t => t.type);
            assert.deepStrictEqual(types, [
                TokenType.COMMENT_START,
                TokenType.COMMENT_END,
            ]);
        });

        test('multiline comment', () => {
            const tokens = allTokens('<!--\nline1\nline2\n-->');
            const body = tokens.find(t => t.type === TokenType.COMMENT_BODY);
            assert.ok(body);
            assert.ok(body.text.includes('line1'));
            assert.ok(body.text.includes('line2'));
        });

        test('unterminated comment', () => {
            const tokens = allTokens('<!-- oops');
            const types = tokens.filter(t => t.type !== TokenType.EOF).map(t => t.type);
            assert.deepStrictEqual(types, [
                TokenType.COMMENT_START,
                TokenType.COMMENT_BODY,
            ]);
        });
    });

    suite('CDATA', () => {
        test('CDATA section', () => {
            const tokens = allTokens('<![CDATA[some <data>]]>');
            const types = tokens.filter(t => t.type !== TokenType.EOF).map(t => t.type);
            assert.deepStrictEqual(types, [
                TokenType.CDATA_START,
                TokenType.CDATA_CONTENT,
                TokenType.CDATA_END,
            ]);
            assert.strictEqual(tokens[1].text, 'some <data>');
        });

        test('empty CDATA', () => {
            const tokens = allTokens('<![CDATA[]]>');
            const content = tokens.find(t => t.type === TokenType.CDATA_CONTENT);
            assert.ok(content);
            assert.strictEqual(content.text, '');
        });
    });

    suite('processing instructions', () => {
        test('XML declaration', () => {
            const tokens = allTokens('<?xml version="1.0"?>');
            const types = tokens.filter(t => t.type !== TokenType.EOF).map(t => t.type);
            assert.deepStrictEqual(types, [
                TokenType.PI_START,
                TokenType.PI_CONTENT,
                TokenType.PI_END,
            ]);
        });

        test('PI with content', () => {
            const tokens = allTokens('<?target data?>');
            const content = tokens.find(t => t.type === TokenType.PI_CONTENT);
            assert.ok(content);
            assert.strictEqual(content.text, 'target data');
        });
    });

    suite('DOCTYPE', () => {
        test('simple DOCTYPE', () => {
            const tokens = allTokens('<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">');
            const hasStart = tokens.some(t => t.type === TokenType.DOCTYPE_START);
            const hasEnd = tokens.some(t => t.type === TokenType.DOCTYPE_END);
            assert.ok(hasStart);
            assert.ok(hasEnd);
        });

        test('DOCTYPE with internal subset', () => {
            const tokens = allTokens('<!DOCTYPE root [<!ENTITY foo "bar">]>');
            const hasStart = tokens.some(t => t.type === TokenType.DOCTYPE_START);
            const hasEnd = tokens.some(t => t.type === TokenType.DOCTYPE_END);
            assert.ok(hasStart);
            assert.ok(hasEnd);
        });
    });

    suite('line/column tracking', () => {
        test('first element at line 0, col 0', () => {
            const token = firstOf('<p>', TokenType.ELEMENT_START);
            assert.ok(token);
            assert.strictEqual(token.line, 0);
            assert.strictEqual(token.column, 0);
        });

        test('element on second line', () => {
            const tokens = allTokens('\n<p>');
            const start = tokens.find(t => t.type === TokenType.ELEMENT_START);
            assert.ok(start);
            assert.strictEqual(start.line, 1);
            assert.strictEqual(start.column, 0);
        });

        test('element after text on same line', () => {
            const tokens = allTokens('abc<p>');
            const start = tokens.find(t => t.type === TokenType.ELEMENT_START);
            assert.ok(start);
            assert.strictEqual(start.line, 0);
            assert.strictEqual(start.column, 3);
        });

        test('CRLF line endings', () => {
            const tokens = allTokens('abc\r\n<p>');
            const start = tokens.find(t => t.type === TokenType.ELEMENT_START);
            assert.ok(start);
            assert.strictEqual(start.line, 1);
            assert.strictEqual(start.column, 0);
        });

        test('offset tracking', () => {
            const tokens = allTokens('text<p id="x">');
            const elemStart = tokens.find(t => t.type === TokenType.ELEMENT_START);
            assert.strictEqual(elemStart!.offset, 4);
            const attrValue = tokens.find(t => t.type === TokenType.ATTR_VALUE);
            assert.strictEqual(attrValue!.offset, 11);
            assert.strictEqual(attrValue!.text, 'x');
        });
    });

    suite('error recovery', () => {
        test('missing closing quote in attribute', () => {
            // When < is found inside attribute value, tokenizer recovers
            const tokens = allTokens('<p id="oops<b>');
            // Should recover and produce tokens for both <p and <b
            const elemNames = tokens
                .filter(t => t.type === TokenType.ELEMENT_NAME_START)
                .map(t => t.text);
            assert.ok(elemNames.includes('p'));
            assert.ok(elemNames.includes('b'));
        });

        test('missing > at end of tag', () => {
            // Tag without closing > before next tag
            const tokens = allTokens('<p id="x"<b>');
            // Should emit synthetic > for <p and parse <b
            const elemNames = tokens
                .filter(t => t.type === TokenType.ELEMENT_NAME_START)
                .map(t => t.text);
            assert.ok(elemNames.length >= 2);
        });

        test('mismatched closing tag', () => {
            // Mismatched tags still produce tokens
            const tokens = allTokens('<a></b>');
            const endName = tokens.find(t => t.type === TokenType.ELEMENT_NAME_END);
            assert.strictEqual(endName!.text, 'b');
        });

        test('> inside attribute value followed by newline recovers', () => {
            const tokens = allTokens('<p id="a>b\n<next>');
            // The > followed by \n should trigger recovery
            const elemNames = tokens
                .filter(t => t.type === TokenType.ELEMENT_NAME_START)
                .map(t => t.text);
            assert.ok(elemNames.includes('p'));
            assert.ok(elemNames.includes('next'));
        });

        test('empty string produces only EOF', () => {
            const tokens = allTokens('');
            assert.strictEqual(tokens.length, 1);
            assert.strictEqual(tokens[0].type, TokenType.EOF);
        });

        test('plain text without any tags', () => {
            const tokens = allTokens('just some text');
            const types = tokenTypes('just some text');
            assert.deepStrictEqual(types, [TokenType.CHAR_DATA]);
            assert.strictEqual(tokens[0].text, 'just some text');
        });
    });

    suite('complete DITA document', () => {
        test('tokenizes a simple topic', () => {
            const input = '<?xml version="1.0"?>\n<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">\n<topic id="t1"><title>Hello</title></topic>';
            const tokens = allTokens(input);
            // Should contain PI, DOCTYPE, elements, text, EOF
            const hasPI = tokens.some(t => t.type === TokenType.PI_START);
            const hasDOCTYPE = tokens.some(t => t.type === TokenType.DOCTYPE_START);
            const hasTitle = tokens.some(t => t.type === TokenType.CHAR_DATA && t.text === 'Hello');
            assert.ok(hasPI);
            assert.ok(hasDOCTYPE);
            assert.ok(hasTitle);
        });

        test('tokenizes element with many attributes', () => {
            const input = '<topicref href="intro.dita" type="concept" scope="local" format="dita"/>';
            const attrNames = allTokens(input)
                .filter(t => t.type === TokenType.ATTR_NAME)
                .map(t => t.text);
            assert.deepStrictEqual(attrNames, ['href', 'type', 'scope', 'format']);
        });
    });

    suite('findAttributeAtOffset', () => {
        test('finds attribute when cursor is in value', () => {
            const input = '<p platform="linux">';
            const offset = 14; // inside "linux"
            const result = findAttributeAtOffset(input, offset);
            assert.ok(result);
            assert.strictEqual(result.attrName, 'platform');
            assert.strictEqual(result.attrValue, 'linux');
            assert.strictEqual(result.elementName, 'p');
        });

        test('finds second attribute value', () => {
            const input = '<image href="pic.png" alt="photo"/>';
            const altOffset = input.indexOf('photo');
            const result = findAttributeAtOffset(input, altOffset);
            assert.ok(result);
            assert.strictEqual(result.attrName, 'alt');
            assert.strictEqual(result.attrValue, 'photo');
        });

        test('returns null when cursor is in text content', () => {
            const input = '<p>text</p>';
            const result = findAttributeAtOffset(input, 4);
            assert.strictEqual(result, null);
        });

        test('returns null when cursor is on element name', () => {
            const input = '<topic id="t1">';
            const result = findAttributeAtOffset(input, 2); // on "op" in topic
            assert.strictEqual(result, null);
        });

        test('valueStart and valueEnd are correct', () => {
            const input = '<p id="test">';
            const result = findAttributeAtOffset(input, 8); // inside "test"
            assert.ok(result);
            assert.strictEqual(result.valueStart, 7);
            assert.strictEqual(result.valueEnd, 11);
            assert.strictEqual(input.substring(result.valueStart, result.valueEnd), 'test');
        });
    });

    suite('findContextAtOffset', () => {
        test('content context in text', () => {
            const input = '<p>hello</p>';
            const result = findContextAtOffset(input, 5); // in "hello"
            assert.strictEqual(result.context, 'content');
        });

        test('element-name context after <', () => {
            const input = '<topic>';
            const result = findContextAtOffset(input, 1); // right after <
            assert.strictEqual(result.context, 'element-name');
        });

        test('attribute-name context after element name', () => {
            const input = '<p >';
            const result = findContextAtOffset(input, 2); // on the space (attribute area)
            assert.strictEqual(result.context, 'attribute-name');
            assert.strictEqual(result.elementName, 'p');
        });

        test('attribute-value context inside quotes', () => {
            const input = '<p id="test">';
            const result = findContextAtOffset(input, 8); // inside "test"
            assert.strictEqual(result.context, 'attribute-value');
            assert.strictEqual(result.attrName, 'id');
        });

        test('attribute-value context right after opening quote', () => {
            const input = '<p id="">';
            const result = findContextAtOffset(input, 7); // right after opening "
            assert.strictEqual(result.context, 'attribute-value');
        });

        test('comment context', () => {
            const input = '<!-- hello -->';
            const result = findContextAtOffset(input, 6); // inside comment
            assert.strictEqual(result.context, 'comment');
        });

        test('cdata context', () => {
            const input = '<![CDATA[data]]>';
            const result = findContextAtOffset(input, 10); // inside CDATA content
            assert.strictEqual(result.context, 'cdata');
        });
    });
});
