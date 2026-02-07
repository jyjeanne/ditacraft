import * as assert from 'assert';
import { handleHover } from '../src/features/hover';
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
        test('cursor on <topic> returns documentation', () => {
            const content = '<topic id="t1"><title>T</title></topic>';
            const result = hover(content, 0, 2); // on "pic" of topic
            assert.ok(result);
            assert.ok(result.contents);
        });

        test('cursor on <section> returns documentation', () => {
            const content = '<topic id="t1"><body><section><title>S</title></section></body></topic>';
            const result = hover(content, 0, 24); // on "ction"
            assert.ok(result);
        });

        test('cursor on <step> returns documentation', () => {
            const content = '<topic id="t1"><taskbody><steps><step><cmd>Do it</cmd></step></steps></taskbody></topic>';
            const result = hover(content, 0, 34); // on "step"
            assert.ok(result);
        });

        test('cursor on <title> returns documentation', () => {
            const content = '<topic id="t1"><title>T</title></topic>';
            const result = hover(content, 0, 17); // on "title" in opening tag
            assert.ok(result);
        });

        test('cursor on <titlealts> returns documentation', () => {
            const content = '<topic id="t1"><titlealts><navtitle>Nav</navtitle></titlealts></topic>';
            const result = hover(content, 0, 18); // on "titlealts"
            assert.ok(result);
            const mc = result.contents as { kind: string; value: string };
            assert.strictEqual(mc.kind, 'markdown');
            assert.ok(mc.value.includes('Alternative titles'));
        });

        test('cursor on <navtitle> returns documentation', () => {
            const content = '<topic id="t1"><titlealts><navtitle>Nav</navtitle></titlealts></topic>';
            const result = hover(content, 0, 28); // on "navtitle"
            assert.ok(result);
            const mc = result.contents as { kind: string; value: string };
            assert.ok(mc.value.includes('Navigation title'));
        });

        test('hover result contains markdown', () => {
            const content = '<topic id="t1"><title>T</title></topic>';
            const result = hover(content, 0, 2);
            assert.ok(result);
            const mc = result.contents as { kind: string; value: string };
            assert.strictEqual(mc.kind, 'markdown');
            assert.ok(mc.value.length > 0);
        });
    });

    suite('Known elements without full docs (children only)', () => {
        test('element in DITA_ELEMENTS but not ELEMENT_DOCS shows children', () => {
            // <dlentry> is in DITA_ELEMENTS (children: dt, dd) but NOT in ELEMENT_DOCS
            // This exercises the children-only fallback path in handleHover
            const content = '<dl><dlentry></dlentry></dl>';
            const result = hover(content, 0, 6); // on "lentry" of <dlentry>
            assert.ok(result);
            const mc = result.contents as { kind: string; value: string };
            assert.strictEqual(mc.kind, 'markdown');
            assert.ok(mc.value.includes('Children'), 'should show children list');
            assert.ok(mc.value.includes('dt'), 'should list dt as child');
        });
    });

    suite('Unknown elements', () => {
        test('cursor on unknown element returns null', () => {
            const content = '<unknownelement>text</unknownelement>';
            const result = hover(content, 0, 3);
            assert.strictEqual(result, null);
        });
    });

    suite('Non-tag positions', () => {
        test('cursor in text content returns null', () => {
            const content = '<p>some text here</p>';
            const result = hover(content, 0, 8); // on "text"
            assert.strictEqual(result, null);
        });

        test('cursor in attribute value returns null', () => {
            const content = '<topic id="myid"><title>T</title></topic>';
            const result = hover(content, 0, 13); // inside "myid"
            assert.strictEqual(result, null);
        });

        test('cursor on closing tag returns documentation', () => {
            const content = '<topic id="t1"><title>T</title></topic>';
            // closing tag </topic> — cursor on "topic" in closing
            const result = hover(content, 0, 34); // on "topic" in </topic>
            assert.ok(result);
        });
    });

    suite('Edge cases', () => {
        test('document not found returns null', () => {
            const docs = createDocs(); // empty
            const result = handleHover(
                {
                    textDocument: { uri: 'file:///nonexistent.dita' },
                    position: { line: 0, character: 0 },
                },
                docs
            );
            assert.strictEqual(result, null);
        });

        test('cursor at start of document returns null', () => {
            const content = 'plain text no tags';
            const result = hover(content, 0, 0);
            assert.strictEqual(result, null);
        });

        test('empty document returns null', () => {
            const result = hover('', 0, 0);
            assert.strictEqual(result, null);
        });
    });

    suite('DITAVAL elements', () => {
        test('cursor on <val> returns documentation', () => {
            const content = '<val><prop action="include"/></val>';
            const result = hover(content, 0, 2); // on "al" of val
            assert.ok(result);
            const mc = result.contents as { kind: string; value: string };
            assert.strictEqual(mc.kind, 'markdown');
            assert.ok(mc.value.includes('DITAVAL root element'));
        });

        test('cursor on <prop> returns documentation', () => {
            const content = '<val><prop action="include"/></val>';
            const result = hover(content, 0, 7); // on "rop" of prop
            assert.ok(result);
            const mc = result.contents as { kind: string; value: string };
            assert.ok(mc.value.includes('Property condition'));
        });

        test('cursor on <revprop> returns documentation', () => {
            const content = '<val><revprop action="flag"/></val>';
            const result = hover(content, 0, 8); // on "vprop" of revprop
            assert.ok(result);
            const mc = result.contents as { kind: string; value: string };
            assert.ok(mc.value.includes('Revision property'));
        });

        test('cursor on <style-conflict> returns documentation', () => {
            const content = '<val><style-conflict foreground-conflict-color="#000000"/></val>';
            const result = hover(content, 0, 10); // on "e-conflict" of style-conflict
            assert.ok(result);
            const mc = result.contents as { kind: string; value: string };
            assert.ok(mc.value.includes('Style conflict'));
        });

        test('cursor on <startflag> returns documentation', () => {
            const content = '<val><prop action="flag"><startflag imageref="flag.png"/></prop></val>';
            const result = hover(content, 0, 28); // on "artflag" of startflag
            assert.ok(result);
            const mc = result.contents as { kind: string; value: string };
            assert.ok(mc.value.includes('Start flag'));
        });
    });
});
