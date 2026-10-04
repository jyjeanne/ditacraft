/**
 * Visual Editor source positions Test Suite (cursor and scroll sync, handoffs; spec §11.2).
 *
 * The page's document is edited after load; offsets are those of the text it writes (what the
 * text editor shows). Page positions must map to the offsets of the same characters and back.
 */

import * as assert from 'assert';
import * as fs from 'fs';
import type { Node as PMNode } from 'prosemirror-model';
import { EditorState, type Transaction } from 'prosemirror-state';
import { parse } from '../../shared/cst/parse';
import { DitaCommands } from '../../shared/editor/commands';
import { buildEditorSchema, type EditorSchema } from '../../shared/editor/schema';
import { SourcePositions } from '../../shared/editor/sourcePositions';
import { buildDocument } from '../../shared/editor/toProseMirror';
import { serializeDocument } from '../../shared/editor/toSource';
import { corpusFiles, ditabaseGrammar } from './helpers';

let es: EditorSchema;
let cmds: DitaCommands;

const TOPIC = [
    '<topic id="t">',
    '  <title>Maintenance</title>',
    '  <body>',
    '    <p id="p1">Check the',
    '       seal &amp; the <b>rotor</b> weekly.</p>',
    '    <p>See <xref href="a.dita"/> now.</p>',
    '    <section>',
    '      <p>Inside.</p>',
    '    </section>',
    '  </body>',
    '</topic>',
].join('\n');

function edited(source: string, change?: (tr: Transaction, doc: PMNode) => void): { doc: PMNode; text: string; map: SourcePositions } {
    const { doc, base } = buildDocument(parse(source), es);
    let state = EditorState.create({ doc });
    if (change) {
        const tr = state.tr;
        change(tr, doc);
        state = state.apply(tr);
        const fix = cmds.normalize(state);
        if (fix) {
            state = state.apply(fix);
        }
    }
    const text = serializeDocument(state.doc, base);
    return { doc: state.doc, text, map: new SourcePositions(state.doc, buildDocument(parse(text), es), es) };
}

function posOf(doc: PMNode, text: string): number {
    let found = -1;
    doc.descendants((node, pos) => {
        if (found === -1 && node.isText && node.text!.includes(text)) {
            found = pos + node.text!.indexOf(text);
        }
        return found === -1;
    });
    assert.notStrictEqual(found, -1, `"${text}" not found`);
    return found;
}

function nameAt(doc: PMNode, pos: number): string {
    const node = doc.nodeAt(pos)!;
    return es.role(node.type)?.element ?? node.type.name;
}

suite('Visual Editor: source positions (cursor and scroll sync)', function () {
    this.timeout(120000);

    suiteSetup(() => {
        es = buildEditorSchema(ditabaseGrammar());
        cmds = new DitaCommands(es);
    });

    test('a character on the page and in the text are the same character, both ways', () => {
        const { doc, text, map } = edited(TOPIC);
        for (const word of ['Check', 'seal', 'rotor', 'weekly', 'now', 'Inside']) {
            const pos = posOf(doc, word);
            const offset = map.offsetOf(pos);
            assert.strictEqual(text.slice(offset, offset + word.length), word);
            assert.deepStrictEqual(map.positionOf(offset), { pos, node: false });
        }
        // Across the wrapped line: the collapsed space is the line break.
        assert.strictEqual(map.positionOf(text.indexOf('seal') - 1).pos, posOf(doc, 'seal') - 1);
    });

    test('after edits on the page, offsets are those of the new text', () => {
        const { doc, text, map } = edited(TOPIC, (tr, d) => {
            tr.insertText('Always ', posOf(d, 'Check'));
            tr.split(tr.mapping.map(posOf(d, 'weekly')));
        });
        for (const word of ['Always', 'weekly', 'Inside']) {
            const offset = map.offsetOf(posOf(doc, word));
            assert.strictEqual(text.slice(offset, offset + word.length), word);
            assert.strictEqual(map.positionOf(offset).pos, posOf(doc, word));
        }
    });

    test('start tags, elements kept whole and layout map to elements; end tags to the end of the text', () => {
        const { doc, text, map } = edited(TOPIC);
        const at = (needle: string) => map.positionOf(text.indexOf(needle));
        assert.strictEqual(nameAt(doc, at('<p id="p1"').pos), 'p');
        assert.strictEqual(at('<p id="p1"').node, true);
        assert.strictEqual(nameAt(doc, at('<xref').pos), 'xref');
        assert.strictEqual(nameAt(doc, at('<section>').pos), 'section');
        // The layout before <section> belongs to the section.
        assert.strictEqual(nameAt(doc, map.positionOf(text.indexOf('<section>') - 3).pos), 'section');
        // In </p>: the end of the paragraph's text.
        const end = map.positionOf(text.indexOf('</p>'));
        assert.deepStrictEqual(end, { pos: posOf(doc, 'weekly.') + 'weekly.'.length, node: false });
        // After the body's last element: the end of the last text.
        assert.strictEqual(map.positionOf(text.indexOf('</body>')).pos, posOf(doc, 'Inside.') + 'Inside.'.length);
        // Back: between blocks, the next element's start; an element kept whole, its start.
        const section = at('<section>').pos;
        assert.strictEqual(map.offsetOf(section), text.indexOf('<section>'));
        assert.strictEqual(map.offsetOf(at('<xref').pos), text.indexOf('<xref'));
    });

    test('corpus: every text position maps to its character and back, after an edit', () => {
        let checked = 0;
        const failures: string[] = [];
        for (const file of corpusFiles().filter((f) => f.endsWith('.dita'))) {
            let e: ReturnType<typeof edited>;
            try {
                e = edited(fs.readFileSync(file, 'utf8'), (tr, doc) => {
                    let first = -1;
                    doc.descendants((n, pos) => {
                        if (first === -1 && n.isText && n.text!.trim().length > 3) {
                            first = pos;
                        }
                        return first === -1;
                    });
                    if (first !== -1) {
                        tr.insertText('Z', first);
                    }
                });
            } catch {
                continue; // not a document the editor opens
            }
            let n = 0;
            e.doc.descendants((node, pos) => {
                if (!node.isText || n > 40 || node.marks.some((m) => m.type.name === 'xml_cdata')) {
                    return n <= 40;
                }
                for (const k of [0, Math.floor(node.text!.length / 2)]) {
                    const ch = node.text![k];
                    const offset = e.map.offsetOf(pos + k);
                    const back = e.map.positionOf(offset);
                    const same = ch === ' ' ? /\s/.test(e.text[offset]) : e.text[offset] === ch || e.text[offset] === '&';
                    if (!same || back.pos !== pos + k) {
                        failures.push(`${file.split(/[\\/]/).pop()}: "${ch}" at ${pos + k} → ${offset} ("${e.text.slice(offset, offset + 8)}") → ${back.pos}`);
                    }
                    checked++;
                    n++;
                }
                return false;
            });
        }
        assert.ok(checked > 1000, `only ${checked} positions checked`);
        assert.deepStrictEqual(failures.slice(0, 10), []);
    });
});
