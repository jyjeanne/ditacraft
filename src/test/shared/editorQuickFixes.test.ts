/**
 * Visual Editor quick fixes Test Suite (spec §11.1).
 *
 * The language server's quick fixes are text edits of the topic. The page makes each one as a
 * change of its own document (src/shared/editor/sourceChange.ts): the attributes of the element
 * whose start tag changes, or the children the edit touches, or the element kept as written,
 * rebuilt from the new text. Written back, the page's document gives the fixed text — here,
 * byte for byte, for the server's fixes — and undo on the page gives the text before the fix.
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { EditorState } from 'prosemirror-state';
import { history, undo } from 'prosemirror-history';
import { parse } from '../../shared/cst/parse';
import { walk } from '../../shared/cst/query';
import { isElement, type ElementNode } from '../../shared/cst/types';
import { buildEditorSchema, type EditorSchema } from '../../shared/editor/schema';
import { applyTextEdits, changedSize, sameReading, sourceChangeTransaction, type TextEdit } from '../../shared/editor/sourceChange';
import { buildDocument, type Base } from '../../shared/editor/toProseMirror';
import { serializeDocument } from '../../shared/editor/toSource';
import { corpusFiles, ditabaseGrammar } from './helpers';

let es: EditorSchema;

const HEADER = ['<?xml version="1.0" encoding="UTF-8"?>', '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">'];
const SRC = [
    ...HEADER,
    '<topic id="pump">',
    '  <body>',
    '    <p>See <b>the <image href="pump.png"/> pump</b> here.</p>',
    '    <p></p>',
    '    <section id="s1" outputclass="x"><title>One</title></section>',
    '    <section id="s1">',
    '      <title>Two</title>',
    '    </section>',
    '    <p>Go to <xref href="#pump" role="other"/>, a',
    '       <xref href="other.dita"   scope="local">long tag</xref>.</p>',
    '    <note>Note <indextermref keyref="k"/> text.</note>',
    '    <p>Old <image href="a.png" alt="Pump"/> style.</p>',
    '  </body>',
    '</topic>',
    '',
].join('\n');

const build = (text: string) => buildDocument(parse(text), es);

/** Apply `edits` (offsets of `text`) on a page loaded from `text`; the written text, or undefined. */
function fixOnPage(text: string, edits: TextEdit[], state?: EditorState, base?: Base): { written: string; state: EditorState; base: Base } | undefined {
    const loaded = build(text);
    const pageBase = base ?? loaded.base;
    const start = state ?? EditorState.create({ doc: loaded.doc, plugins: [history()] });
    const tr = sourceChangeTransaction(start, build(serializeDocument(start.doc, pageBase)), edits, es, pageBase, build);
    if (!tr) {
        return undefined;
    }
    const next = start.apply(tr);
    return { written: serializeDocument(next.doc, pageBase), state: next, base: pageBase };
}

const at = (text: string, needle: string, from = 0): number => {
    const i = text.indexOf(needle, from);
    assert.ok(i >= 0, `"${needle}" not found`);
    return i;
};

/** The server's edits (server/src/features/codeActions.ts), on the fixture. */
const FIXES: Record<string, (text: string) => TextEdit[]> = {
    // DITA-STRUCT-004: after the root's start tag.
    'Add <title> element': (text) => {
        const end = at(text, '<topic id="pump">') + '<topic id="pump">'.length;
        return [{ start: end, end, text: '\n  <title></title>' }];
    },
    // DITA-SCH-030: a self-closing image becomes an image with an empty <alt>.
    'Add <alt> element': (text) => {
        const tag = at(text, '<image href="pump.png"/>');
        const slash = tag + '<image href="pump.png"'.length;
        return [{ start: slash, end: slash + 2, text: '><alt></alt></image>' }];
    },
    // DITA-STRUCT-005: the empty element, its indentation and its line break.
    'Remove empty <p>': (text) => {
        const start = at(text, '<p></p>');
        return [{ start: start - 4, end: start + '<p></p>\n'.length, text: '' }];
    },
    // DITA-ID-001: the second id renamed.
    'Rename to make unique': (text) => {
        const second = at(text, 'id="s1"', at(text, 'id="s1"') + 1) + 'id="'.length;
        return [{ start: second, end: second + 2, text: 's1_k3x9' }];
    },
    // DITA-SCH-001: after role="other".
    'Add otherrole attribute': (text) => {
        const end = at(text, 'role="other"') + 'role="other"'.length;
        return [{ start: end, end, text: ' otherrole=""' }];
    },
    // DITA-SCH-003: the element and the spaces before it.
    'Remove deprecated <indextermref>': (text) => {
        const start = at(text, '<indextermref');
        return [{ start: start - 1, end: start + '<indextermref keyref="k"/>'.length, text: '' }];
    },
    // DITA-SCH-011: the attribute removed, an <alt> element added (two edits).
    'Convert alt attribute to <alt> element': (text) => {
        const attr = at(text, ' alt="Pump"');
        const slash = at(text, '/>', attr);
        return [{ start: attr, end: attr + ' alt="Pump"'.length, text: '' }, { start: slash, end: slash + 2, text: '><alt>Pump</alt></image>' }];
    },
};

suite('Visual Editor: quick fixes from the page', function () {
    this.timeout(60000);

    suiteSetup(() => {
        es = buildEditorSchema(ditabaseGrammar());
    });

    for (const [title, edits] of Object.entries(FIXES)) {
        test(`${title}: the page writes exactly the fixed text, undo gives the text before`, () => {
            // A new empty element is written as the writer writes new elements: <title/>.
            const fixed = applyTextEdits(SRC, edits(SRC))!.replace('<title></title>', '<title/>');
            const result = fixOnPage(SRC, edits(SRC));
            assert.ok(result, 'made as a change of the page');
            assert.strictEqual(result.written, fixed);
            let state = result.state;
            assert.ok(undo(state, (tr) => {
                state = state.apply(tr);
            }));
            assert.strictEqual(serializeDocument(state.doc, result.base), SRC);
        });
    }

    test('a fix on the root element\'s start tag sets its attributes (Add id)', () => {
        const text = [...HEADER, '<topic>', '  <title>T</title>', '</topic>', ''].join('\n');
        const end = at(text, '<topic') + '<topic'.length;
        const result = fixOnPage(text, [{ start: end, end, text: ' id="pump"' }]);
        assert.strictEqual(result?.written, text.replace('<topic>', '<topic id="pump">'));
    });

    test('a fix after edits on the page: the edits stay, the fix applies to the text as it is now', () => {
        const loaded = build(SRC);
        let state = EditorState.create({ doc: loaded.doc, plugins: [history()] });
        let typed = -1;
        state.doc.descendants((n, p) => {
            if (typed === -1 && n.isText && n.text!.startsWith('See ')) {
                typed = p + 'See'.length;
            }
            return typed === -1;
        });
        state = state.apply(state.tr.insertText(' also', typed));
        const now = serializeDocument(state.doc, loaded.base);
        assert.ok(now.includes('See also <b>'));
        const fixed = applyTextEdits(now, FIXES['Add <alt> element'](now))!;
        const result = fixOnPage(now, FIXES['Add <alt> element'](now), state, loaded.base);
        assert.strictEqual(result?.written, fixed);
    });

    test('a fix outside the root element (Add DOCTYPE) is not a change of the page: undefined', () => {
        const text = ['<?xml version="1.0" encoding="UTF-8"?>', '<topic id="t"><title>T</title></topic>', ''].join('\n');
        const after = text.indexOf('\n') + 1;
        assert.strictEqual(fixOnPage(text, [{ start: after, end: after, text: '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">\n' }]), undefined);
    });

    test('edits that leave the text not well-formed, overlap or change only layout: undefined', () => {
        const p = at(SRC, '<p>See');
        assert.strictEqual(fixOnPage(SRC, [{ start: p, end: p + 3, text: '<p' }]), undefined);
        assert.strictEqual(applyTextEdits(SRC, [{ start: 5, end: 9, text: '' }, { start: 8, end: 10, text: '' }]), undefined);
        const gap = at(SRC, '\n    <p></p>');
        assert.strictEqual(fixOnPage(SRC, [{ start: gap, end: gap, text: '\n' }]), undefined);
    });

    test('sameReading and changedSize', () => {
        assert.ok(sameReading('<a x="1" y="2"><b>t  u</b>\n  <c/></a>', '<a y="2" x="1">\n<b>t u</b><c/></a>'));
        assert.ok(!sameReading('<a x="1"/>', '<a x="2"/>'));
        assert.ok(!sameReading('<a><b/></a>', '<a><c/></a>'));
        assert.ok(!sameReading('<a>', '<a/>'));
        assert.strictEqual(changedSize('abcdef', 'abXYef'), 2);
        assert.strictEqual(changedSize('abc', 'abc'), 0);
        assert.strictEqual(changedSize('ab', 'aXXb'), 2);
    });

    test('fuzz: attributes added to and elements removed from corpus topics; undo restores the text exactly', () => {
        let seed = Number(process.env.DITACRAFT_FUZZ_SEED) || 11;
        const rnd = (n: number): number => {
            seed = (seed * 1103515245 + 12345) & 0x7fffffff;
            return seed % n;
        };
        const runs = Number(process.env.DITACRAFT_FUZZ_RUNS) || 4;
        const failures: string[] = [];
        let made = 0;
        let tried = 0;
        for (const file of corpusFiles().filter((f) => f.endsWith('.dita'))) {
            const source = fs.readFileSync(file, 'utf8');
            let cst;
            try {
                cst = parse(source);
            } catch {
                continue;
            }
            const elements = [...walk(cst.children)].filter((n): n is ElementNode => isElement(n) && n.parent !== null && n.parent !== undefined);
            if (elements.length === 0) {
                continue;
            }
            for (let run = 0; run < runs; run++) {
                const el = elements[rnd(elements.length)];
                const tagEnd = el.openTagRange.end - (el.selfClosing ? 2 : 1);
                const edits: TextEdit[] = rnd(2) === 0
                    ? [{ start: tagEnd, end: tagEnd, text: ' outputclass="fixed"' }]
                    : [{ start: el.range.start, end: el.range.end, text: '' }];
                if (edits[0].text !== '' && el.attrs.some((a) => a.name === 'outputclass')) {
                    continue;
                }
                tried++;
                const name = `${path.basename(file)} <${el.name}> ${edits[0].text ? 'attribute' : 'removed'}`;
                try {
                    const loaded = buildDocument(cst, es);
                    const start = EditorState.create({ doc: loaded.doc, plugins: [history()] });
                    const tr = sourceChangeTransaction(start, build(source), edits, es, loaded.base, build);
                    if (!tr) {
                        continue; // the caller applies the text itself
                    }
                    made++;
                    const after = start.apply(tr);
                    const written = serializeDocument(after.doc, loaded.base);
                    if (!sameReading(written, applyTextEdits(source, edits)!)) {
                        failures.push(`${name}: reads differently`);
                    }
                    let back = after;
                    undo(back, (t) => {
                        back = back.apply(t);
                    });
                    if (serializeDocument(back.doc, loaded.base) !== source) {
                        failures.push(`${name}: undo does not restore the text`);
                    }
                } catch (error) {
                    failures.push(`${name}: ${(error as Error).message}`);
                }
            }
        }
        assert.deepStrictEqual(failures.slice(0, 10), []);
        assert.ok(tried > 50 && made / tried > 0.6, `${made} of ${tried} changes made on the page`);
    });
});
