/**
 * Visual Editor problem marks Test Suite (spec §11.1).
 *
 * Diagnostics are offsets in the document's current text; the page's document was built from
 * an earlier text and edited since. Each test edits the page's document, takes the text it
 * writes (what the language server sees), places diagnostics in that text, and checks where
 * the marks land in the edited document.
 */

import * as assert from 'assert';
import * as fs from 'fs';
import type { Node as PMNode } from 'prosemirror-model';
import { EditorState, type Transaction } from 'prosemirror-state';
import { parse } from '../../shared/cst/parse';
import { DitaCommands } from '../../shared/editor/commands';
import { problemMarks, type ProblemItem } from '../../shared/editor/problems';
import { buildEditorSchema, type EditorSchema } from '../../shared/editor/schema';
import { buildDocument } from '../../shared/editor/toProseMirror';
import { serializeDocument } from '../../shared/editor/toSource';
import { corpusFiles, ditabaseGrammar } from './helpers';

let es: EditorSchema;
let cmds: DitaCommands;

const TOPIC = [
    '<topic id="t">',
    '  <title>Maintenance</title>',
    '  <body>',
    '    <p id="dup">Check the',
    '       seal &amp; the <b>rotor</b> weekly.</p>',
    '    <p id="dup">See <xref href="missing.dita"/> and <ph>the <i>manual</i></ph>.</p>',
    '    <note>Keep <codeph>x</codeph> clean.</note>',
    '  </body>',
    '</topic>',
].join('\n');

interface Edited {
    doc: PMNode;
    text: string;
}

/** The page's document after `change`, and the text it writes. */
function edited(source: string, change?: (tr: Transaction, doc: PMNode) => void): Edited {
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
    return { doc: state.doc, text: serializeDocument(state.doc, base) };
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

function at(text: string, needle: string, length = needle.length, nth = 0, severity: ProblemItem['severity'] = 'error'): ProblemItem {
    let start = -1;
    for (let k = 0; k <= nth; k++) {
        start = text.indexOf(needle, start + 1);
    }
    assert.notStrictEqual(start, -1, `"${needle}" not in the text`);
    return { start, end: start + length, line: text.slice(0, start).split('\n').length, severity, message: `about ${needle}` };
}

function marksFor(e: Edited, items: ProblemItem[]) {
    return problemMarks(e.doc, buildDocument(parse(e.text), es), items, es);
}

function nodeName(doc: PMNode, pos: number): string {
    const node = doc.nodeAt(pos)!;
    return es.role(node.type)?.element ?? node.type.name;
}

suite('Visual Editor: problem marks (spec §11.1)', function () {
    this.timeout(120000);

    suiteSetup(() => {
        es = buildEditorSchema(ditabaseGrammar());
        cmds = new DitaCommands(es);
    });

    test('a diagnostic in a start tag marks the element; two on one element make one mark', () => {
        const e = edited(TOPIC);
        const [mark] = marksFor(e, [at(e.text, 'dup', 3, 1), at(e.text, '<p id="dup">See', 1, 0, 'warning')]);
        assert.strictEqual(mark.inline, false);
        assert.strictEqual(nodeName(e.doc, mark.from), 'p');
        assert.strictEqual(e.doc.nodeAt(mark.from)!.textContent.startsWith('See'), true);
        assert.strictEqual(mark.items.length, 2);
        assert.strictEqual(mark.severity, 'error');
    });

    test('a diagnostic in text marks that text, across a wrapped line and an entity', () => {
        const e = edited(TOPIC);
        const [mark] = marksFor(e, [at(e.text, 'the\n       seal &amp; the', 'the\n       seal &amp; the'.length)]);
        assert.strictEqual(mark.inline, true);
        assert.strictEqual(e.doc.textBetween(mark.from, mark.to), 'the seal & the');
    });

    test('after edits on the page, marks land on the same words of the edited document', () => {
        const e = edited(TOPIC, (tr, doc) => {
            tr.insertText('Always ', posOf(doc, 'Check'));
            tr.split(tr.mapping.map(posOf(doc, 'seal')));
        });
        assert.ok(e.text.includes('Always Check'), e.text);
        const marks = marksFor(e, [at(e.text, 'weekly'), at(e.text, 'manual'), at(e.text, 'clean')]);
        assert.deepStrictEqual(marks.map((m) => e.doc.textBetween(m.from, m.to)), ['weekly', 'manual', 'clean']);
        assert.ok(marks.every((m) => m.inline));
    });

    test('an element kept whole (a link) is marked as a whole', () => {
        const e = edited(TOPIC);
        const [mark] = marksFor(e, [at(e.text, 'missing.dita')]);
        assert.strictEqual(mark.inline, false);
        assert.strictEqual(nodeName(e.doc, mark.from), 'xref');
        assert.strictEqual(mark.to - mark.from, 1);
    });

    test('a phrase\'s start tag marks the phrase; the topic\'s start tag the topic', () => {
        const e = edited(TOPIC);
        const marks = marksFor(e, [at(e.text, '<ph>', 1), at(e.text, '<topic', 1)]);
        assert.deepStrictEqual(marks.map((m) => [nodeName(e.doc, m.from), m.inline]), [['topic', false], ['ph', false]]);
    });

    test('a range running past its paragraph stops at the paragraph\'s end', () => {
        const e = edited(TOPIC);
        const item = at(e.text, 'clean');
        item.end = e.text.length;
        const [mark] = marksFor(e, [item]);
        assert.strictEqual(e.doc.textBetween(mark.from, mark.to), 'clean.');
    });

    test('where the page\'s document differs from the text, the mark goes to the deepest element that matches', () => {
        const e = edited(TOPIC);
        const other = TOPIC.replace('<note>Keep <codeph>x</codeph> clean.</note>', '<section><p>Keep clean.</p></section>');
        const fresh = buildDocument(parse(other), es);
        const [mark] = problemMarks(e.doc, fresh, [at(other, 'clean')], es);
        assert.strictEqual(nodeName(e.doc, mark.from), 'body');
    });

    test('corpus: every word of every edited topic is found again', () => {
        const files = corpusFiles().filter((f) => f.endsWith('.dita'));
        let checked = 0;
        const failures: string[] = [];
        for (const file of files) {
            const source = fs.readFileSync(file, 'utf8');
            let e: Edited;
            try {
                // Type at the start of the first paragraph-like text: positions after it shift.
                e = edited(source, (tr, doc) => {
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
            const fresh = buildDocument(parse(e.text), es);
            const items: ProblemItem[] = [];
            const expected: string[] = [];
            fresh.doc.descendants((n) => {
                const t = n.isText ? fresh.base.origin.get(n)?.text : undefined;
                const m = t && !t.cdata ? /[A-Za-z]{4,}/.exec(t.display) : null;
                if (t && m && items.length < 25) {
                    items.push({ start: t.map[m.index], end: t.map[m.index + m[0].length - 1] + 1, line: 1, severity: 'warning', message: m[0] });
                    expected.push(m[0]);
                }
                return true;
            });
            for (const [k, mark] of problemMarks(e.doc, fresh, items, es).entries()) {
                checked++;
                const text = mark.inline ? e.doc.textBetween(mark.from, mark.to) : '(element)';
                if (!mark.items.some((i) => i.message === text)) {
                    failures.push(`${file.split(/[\\/]/).pop()} #${k}: ${mark.items.map((i) => i.message).join('/')} → ${text}`);
                }
            }
        }
        assert.ok(checked > 1000, `only ${checked} marks checked`);
        assert.deepStrictEqual(failures.slice(0, 10), []);
    });
});
