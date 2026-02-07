import * as assert from 'assert';
import { formatXML } from '../src/features/formatting';

suite('formatXML', () => {
    const fmt = (text: string) => formatXML(text, 2, true);

    suite('Basic indentation', () => {
        test('nested block elements', () => {
            const input = '<topic><body><p>Hello</p></body></topic>';
            const result = fmt(input);
            const lines = result.trimEnd().split('\n');
            assert.strictEqual(lines[0], '<topic>');
            assert.strictEqual(lines[1], '  <body>');
            assert.strictEqual(lines[2], '    <p>Hello</p>');
            assert.strictEqual(lines[3], '  </body>');
            assert.strictEqual(lines[4], '</topic>');
        });

        test('already formatted input (idempotent)', () => {
            const input = '<topic>\n  <body>\n    <p>Hello</p>\n  </body>\n</topic>\n';
            const result = fmt(input);
            assert.strictEqual(result, input);
        });

        test('self-closing block element', () => {
            const input = '<topic><topicref href="file.dita"/></topic>';
            const result = fmt(input);
            assert.ok(result.includes('  <topicref'));
        });
    });

    suite('Inline elements', () => {
        test('inline elements stay on same line', () => {
            const input = '<p>Click <b>here</b> for <i>details</i></p>';
            const result = fmt(input);
            // The whole content should be on one line since it's short
            assert.ok(result.includes('<b>here</b>'));
            assert.ok(result.includes('<i>details</i>'));
        });

        test('ph element is inline', () => {
            const input = '<p>Use <ph>this</ph> text</p>';
            const result = fmt(input);
            assert.ok(result.includes('<ph>this</ph>'));
        });

        test('codeph element is inline', () => {
            const input = '<p>Run <codeph>cmd</codeph> now</p>';
            const result = fmt(input);
            assert.ok(result.includes('<codeph>cmd</codeph>'));
        });
    });

    suite('Preformatted elements', () => {
        test('codeblock content is preserved', () => {
            const input = '<topic><body><codeblock>\n  function foo() {\n    return 1;\n  }\n</codeblock></body></topic>';
            const result = fmt(input);
            assert.ok(result.includes('function foo()'));
            assert.ok(result.includes('    return 1;'));
        });

        test('pre element content is preserved', () => {
            const input = '<topic><body><pre>  exact   spacing</pre></body></topic>';
            const result = fmt(input);
            assert.ok(result.includes('exact   spacing'));
        });
    });

    suite('Special constructs', () => {
        test('DOCTYPE declaration', () => {
            const input = '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">\n<topic id="t1"><title>T</title></topic>';
            const result = fmt(input);
            assert.ok(result.startsWith('<!DOCTYPE'));
        });

        test('XML processing instruction', () => {
            const input = '<?xml version="1.0"?>\n<topic><title>T</title></topic>';
            const result = fmt(input);
            assert.ok(result.startsWith('<?xml'));
        });

        test('comments', () => {
            const input = '<topic><!-- A comment --><title>T</title></topic>';
            const result = fmt(input);
            assert.ok(result.includes('<!-- A comment -->'));
        });

        test('CDATA', () => {
            const input = '<topic><body><p><![CDATA[raw & data]]></p></body></topic>';
            const result = fmt(input);
            assert.ok(result.includes('<![CDATA[raw & data]]>'));
        });
    });

    suite('Tabs vs spaces', () => {
        test('tab indentation', () => {
            const input = '<topic><body><p>Text</p></body></topic>';
            const result = formatXML(input, 4, false);
            assert.ok(result.includes('\t<body>'));
            assert.ok(result.includes('\t\t<p>Text</p>'));
        });

        test('4-space indentation', () => {
            const input = '<topic><body><p>Text</p></body></topic>';
            const result = formatXML(input, 4, true);
            assert.ok(result.includes('    <body>'));
            assert.ok(result.includes('        <p>Text</p>'));
        });
    });

    suite('Edge cases', () => {
        test('empty string returns empty', () => {
            const result = fmt('');
            assert.strictEqual(result, '');
        });

        test('result ends with newline', () => {
            const result = fmt('<topic><title>T</title></topic>');
            assert.ok(result.endsWith('\n'));
        });

        test('simple text-only element stays on one line', () => {
            const result = fmt('<title>My Title</title>');
            assert.ok(result.trimEnd().includes('<title>My Title</title>'));
        });
    });
});
