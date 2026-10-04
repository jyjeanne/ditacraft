/**
 * Visual Editor core Test Suite (spec §12.5, §13).
 *
 * The editor document is built from the CST and every edit is written back through the
 * lossless serializer. The contract (§12.5): with no edit the source is reproduced byte
 * for byte, and an edit changes only the bytes it touches — checked on hand-written
 * documents and fuzzed over every text node of the repository's DITA corpus.
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { Node as PMNode } from 'prosemirror-model';
import { EditorState, type Transaction } from 'prosemirror-state';
import { parse } from '../../shared/cst/parse';
import { doctypeInternalSubset } from '../../shared/cst/query';
import { buildBundledGrammars } from '../../shared/grammar/buildGrammars';
import type { Grammar, GrammarIndex } from '../../shared/grammar/types';
import { minimalEdit } from '../../shared/editor/minimalEdit';
import { buildEditorSchema, type EditorSchema } from '../../shared/editor/schema';
import { buildDocument, decodeText, type BuildResult } from '../../shared/editor/toProseMirror';
import { serializeDocument } from '../../shared/editor/toSource';
import { decodeXmlText, internalSubsetEntities } from '../../shared/render/html';
import { readingSignature } from './editorHelpers';
import { corpusFiles, ditabaseGrammar, REPO_ROOT, DTDS_DIR } from './helpers';

let es: EditorSchema;

function load(source: string): BuildResult {
    const cst = parse(source);
    const subset = internalSubsetEntities(doctypeInternalSubset(cst));
    return buildDocument(cst, es, { entity: (name) => subset.get(name) ?? es.grammar.entities[name] });
}

/** Apply `change` to a fresh editor state of `source`; return the serialized result. */
function edit(source: string, change: (tr: Transaction, doc: PMNode) => void): string {
    const { doc, base } = load(source);
    const tr = EditorState.create({ doc }).tr;
    change(tr, doc);
    return serializeDocument(tr.doc, base);
}

/** Position (in the editor document) of the first occurrence of `text` inside a text node. */
function posOf(doc: PMNode, text: string, nth = 0): number {
    let found = -1;
    let seen = 0;
    doc.descendants((node, pos) => {
        if (found !== -1) {
            return false;
        }
        if (node.isText) {
            let from = 0;
            for (;;) {
                const k = node.text!.indexOf(text, from);
                if (k === -1) {
                    break;
                }
                if (seen++ === nth) {
                    found = pos + k;
                    return false;
                }
                from = k + 1;
            }
        }
        return true;
    });
    assert.notStrictEqual(found, -1, `"${text}" not found`);
    return found;
}

function nodeAt(doc: PMNode, typeName: string, nth = 0): { node: PMNode; pos: number } {
    let result: { node: PMNode; pos: number } | undefined;
    let seen = 0;
    doc.descendants((node, pos) => {
        if (!result && node.type.name === typeName && seen++ === nth) {
            result = { node, pos };
        }
        return !result;
    });
    assert.ok(result, `no ${typeName} #${nth}`);
    return result!;
}

const TOPIC = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd">',
    '<topic id="t">',
    '  <title>Pump  maintenance</title>',
    '  <body>',
    '    <p id="p1">Check the',
    '       seal &amp; the <b>rotor</b> weekly.</p>',
    '    <!-- reviewed -->',
    '    <p>Second paragraph.</p>',
    '  </body>',
    '</topic>',
    '',
].join('\n');

suite('Visual Editor: core (spec §12–§13)', function () {
    this.timeout(180000);

    suiteSetup(() => {
        es = buildEditorSchema(ditabaseGrammar());
    });

    suite('schema', () => {
        test('every bundled grammar yields an editor schema', () => {
            let dir = path.join(REPO_ROOT, 'out', 'grammars');
            if (!fs.existsSync(path.join(dir, 'index.json'))) {
                dir = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-editor-')), 'grammars');
                buildBundledGrammars({ dtdsDir: DTDS_DIR, outDir: dir });
            }
            const index = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8')) as GrammarIndex;
            const failures: string[] = [];
            for (const entry of index.grammars) {
                try {
                    const grammar = JSON.parse(fs.readFileSync(path.join(dir, entry.file), 'utf8')) as Grammar;
                    buildEditorSchema(grammar);
                } catch (error) {
                    failures.push(`${entry.id}: ${(error as Error).message.split('\n')[0]}`);
                }
            }
            assert.ok(index.grammars.length >= 50);
            assert.deepStrictEqual(failures, []);
        });

        test('block-mixed elements have a textblock variant; structures a loose one; marks exist', () => {
            assert.strictEqual(es.nodeType('p', 'block', 'text')?.isTextblock, true);
            assert.strictEqual(es.nodeType('p', 'block')?.isTextblock, false);
            assert.ok(es.nodeType('concept', 'block', 'loose'));
            assert.ok(es.markType('b'));
            assert.ok(es.markType('codeph'));
            assert.strictEqual(es.nodeType('image', 'inline')?.isAtom, true);
            assert.strictEqual(es.nodeType('image', 'block')?.name, 'image__block');
        });
    });

    suite('loading', () => {
        test('text is shown as it reads: entities decoded, layout whitespace collapsed and trimmed', () => {
            const { doc } = load(TOPIC);
            const p = nodeAt(doc, 'p__text').node;
            assert.strictEqual(p.textContent, 'Check the seal & the rotor weekly.');
            assert.strictEqual(nodeAt(doc, 'title').node.textContent, 'Pump maintenance');
            const rotor = p.child(1);
            assert.strictEqual(rotor.text, 'rotor');
            assert.strictEqual(rotor.marks[0].type.name, 'm_b');
        });

        test('decodeText maps every displayed character back to the source', () => {
            const pieces = decodeText('a  &amp;\n b&#x41;&prod;c', 100, false);
            assert.deepStrictEqual(pieces.map((p) => p.kind), ['text', 'entity', 'text']);
            const first = pieces[0] as { display: string; map: number[] };
            assert.strictEqual(first.display, 'a & bA');
            // a · (2 spaces) · &amp; · (\n + space) · b · &#x41; · end before &prod;
            assert.deepStrictEqual(first.map, [100, 101, 103, 108, 110, 111, 117]);
        });

        test('reused content, keyref\'d phrases and unknown elements are kept whole', () => {
            const { doc } = load('<topic id="t"><title>T</title><body><p conref="lib.dita#l/p"/><p>Use <keyword keyref="prod"/> and <mystery>x</mystery>.</p></body></topic>');
            const kinds: string[] = [];
            doc.descendants((n) => {
                if (n.isAtom && !n.isText) {
                    kinds.push(n.type.name);
                }
                return true;
            });
            assert.deepStrictEqual(kinds, ['p__opaque', 'keyword__opaque', 'xml_unknown_inline']);
        });

        test('a structure that does not follow the DTD loads as its loose variant', () => {
            const { doc } = load('<topic id="t"><body><p>No title yet.</p></body></topic>');
            assert.strictEqual(doc.firstChild!.type.name, 'topic__loose');
        });
    });

    suite('round trip without edits', () => {
        test('every corpus topic is reproduced byte for byte', () => {
            const failures: string[] = [];
            let checked = 0;
            for (const file of corpusFiles().filter((f) => f.endsWith('.dita'))) {
                const source = fs.readFileSync(file, 'utf8');
                try {
                    const { doc, base } = load(source);
                    if (serializeDocument(doc, base) !== source) {
                        failures.push(path.basename(file));
                    }
                    checked++;
                } catch (error) {
                    failures.push(`${path.basename(file)}: ${(error as Error).message}`);
                }
            }
            assert.ok(checked > 50, `only ${checked} files`);
            assert.deepStrictEqual(failures, []);
        });
    });

    suite('edits change only the bytes they touch', () => {
        test('typing inside a wrapped paragraph inserts exactly the typed character', () => {
            const out = edit(TOPIC, (tr, doc) => tr.insertText('!', posOf(doc, 'weekly') + 'weekly'.length));
            assert.deepStrictEqual(minimalEdit(TOPIC, out), { start: TOPIC.indexOf(' weekly.') + 7, end: TOPIC.indexOf(' weekly.') + 7, text: '!' });
        });

        test('typing across collapsed whitespace keeps the line break', () => {
            const out = edit(TOPIC, (tr, doc) => tr.insertText('s', posOf(doc, 'the seal') + 3));
            assert.ok(out.includes('Check thes\n       seal'), out);
        });

        test('an entity next to the edit stays an entity; typed markup characters are escaped', () => {
            const out = edit(TOPIC, (tr, doc) => tr.insertText('<x> & ', posOf(doc, 'seal') + 5));
            assert.ok(out.includes('seal &lt;x&gt; &amp; &amp; the'), out);
        });

        test('deleting a word deletes only its bytes', () => {
            const out = edit(TOPIC, (tr, doc) => {
                const at = posOf(doc, 'Second ');
                tr.delete(at, at + 'Second '.length);
            });
            assert.deepStrictEqual(minimalEdit(TOPIC, out), { start: TOPIC.indexOf('Second '), end: TOPIC.indexOf('Second ') + 7, text: '' });
        });

        test('an edit next to repeated references is whole references (deleting the > of <step><cmd>)', () => {
            // `gt;&` and `&gt;` give the same text; the edit is the reference.
            assert.deepStrictEqual(minimalEdit('&lt;step&gt;&lt;cmd&gt;', '&lt;step&lt;cmd&gt;'), { start: 8, end: 12, text: '' });
            assert.deepStrictEqual(minimalEdit('a &amp;&amp; b', 'a &amp; b'), { start: 7, end: 12, text: '' });
            assert.deepStrictEqual(minimalEdit('&amp;x', '&amp;&amp;x'), { start: 5, end: 5, text: '&amp;' });
            assert.deepStrictEqual(minimalEdit('abc', 'abXc'), { start: 2, end: 2, text: 'X' });
        });

        test('bolding a word keeps the paragraph\'s line breaks and entities', () => {
            const out = edit(TOPIC, (tr, doc) => {
                const at = posOf(doc, 'seal');
                tr.addMark(at, at + 4, es.markType('b')!.create());
            });
            assert.ok(out.includes('<p id="p1">Check the\n       <b>seal</b> &amp; the <b>rotor</b> weekly.</p>'), out);
        });

        test('removing bold keeps the text', () => {
            const out = edit(TOPIC, (tr, doc) => {
                const at = posOf(doc, 'rotor');
                tr.removeMark(at, at + 5, es.markType('b')!);
            });
            assert.ok(out.includes('&amp; the rotor weekly.</p>'), out);
        });

        test('splitting a paragraph writes a second one without the @id', () => {
            // Enter between "the " and "seal": the first part keeps its source (the line
            // break after "the" stays), the second is new, its phrases kept as written.
            const out = edit(TOPIC, (tr, doc) => tr.split(posOf(doc, 'seal')));
            assert.ok(out.includes('<p id="p1">Check the\n       </p>\n    <p>seal &amp; the <b>rotor</b> weekly.</p>'), out);
            parse(out);
        });

        test('deleting an element kept whole inside bold takes the emptied bold with it', () => {
            const source = '<topic id="t"><title>T</title><body><p>See <b><keyword keyref="prod"/></b> now and <b>x <ph conref="l.dita#l/p"/></b>.</p></body></topic>';
            const first = edit(source, (tr, doc) => {
                const { node, pos } = nodeAt(doc, 'keyword__opaque');
                tr.delete(pos, pos + node.nodeSize);
            });
            assert.strictEqual(first, source.replace('<b><keyword keyref="prod"/></b>', ''));
            const second = edit(source, (tr, doc) => {
                const { node, pos } = nodeAt(doc, 'ph__opaque');
                tr.delete(pos, pos + node.nodeSize);
            });
            assert.strictEqual(second, source.replace('<ph conref="l.dita#l/p"/>', ''));
        });

        test('deleting a paragraph leaves no empty line; the comment before it stays', () => {
            const out = edit(TOPIC, (tr, doc) => {
                const { node, pos } = nodeAt(doc, 'p__text', 1);
                tr.delete(pos, pos + node.nodeSize);
            });
            assert.strictEqual(out, TOPIC.replace('\n    <p>Second paragraph.</p>', ''));
        });

        test('a new paragraph is indented like its siblings', () => {
            const out = edit(TOPIC, (tr, doc) => {
                const { node, pos } = nodeAt(doc, 'p__text', 1);
                tr.insert(pos + node.nodeSize, es.nodeType('p', 'block', 'text')!.create(null, es.schema.text('Third.')));
            });
            assert.ok(out.includes('<p>Second paragraph.</p>\n    <p>Third.</p>\n  </body>'), out);
        });

        test('changing an attribute rewrites only that start tag, other attributes kept as written', () => {
            const source = "<topic id='t'><title>T</title><body><p id='a' outputclass=\"x &amp; y\">Text</p></body></topic>";
            const out = edit(source, (tr, doc) => {
                const { node, pos } = nodeAt(doc, 'p__text');
                tr.setNodeMarkup(pos, undefined, { ...node.attrs, xml: [['id', 'b'], ['outputclass', 'x & y']] });
            });
            assert.strictEqual(out, source.replace("id='a'", "id='b'"));
        });

        test('named entities are atoms and never rewritten; CDATA stays CDATA', () => {
            const source = '<!DOCTYPE topic [<!ENTITY prod "AquaFlow">]><topic id="t"><title>T</title><body><p>Use &prod; daily.</p>'
                + '<codeblock><![CDATA[if (a < b) {}]]></codeblock></body></topic>';
            let out = edit(source, (tr, doc) => tr.insertText('very ', posOf(doc, 'daily')));
            assert.ok(out.includes('<p>Use &prod; very daily.</p>'), out);
            out = edit(source, (tr, doc) => tr.insertText(' ]]> x', posOf(doc, '{}') + 2));
            assert.ok(out.includes('<![CDATA[if (a < b) {} ]]]]><![CDATA[> x]]>'), out);
            parse(out);
        });

        test('undoing an edit restores the source exactly', () => {
            const { doc, base } = load(TOPIC);
            const state = EditorState.create({ doc });
            const tr = state.tr;
            tr.insertText('XYZ', posOf(doc, 'seal'));
            tr.addMark(posOf(tr.doc, 'Second'), posOf(tr.doc, 'Second') + 6, es.markType('i')!.create());
            const after = state.apply(tr);
            const undo = after.tr;
            for (let k = tr.steps.length - 1; k >= 0; k--) {
                undo.step(tr.steps[k].invert(tr.docs[k]));
            }
            assert.notStrictEqual(serializeDocument(tr.doc, base), TOPIC);
            assert.strictEqual(serializeDocument(undo.doc, base), TOPIC);
        });

        test('a self-closing element that gains text is opened; an element emptied becomes <tag/>', () => {
            const source = '<topic id="t"><title>T</title><body><p/><p>Gone</p></body></topic>';
            let out = edit(source, (tr, doc) => tr.insertText('New', nodeAt(doc, 'p__text').pos + 1));
            assert.strictEqual(out, source.replace('<p/>', '<p>New</p>'));
            out = edit(source, (tr, doc) => {
                const at = posOf(doc, 'Gone');
                tr.delete(at, at + 4);
            });
            assert.strictEqual(out, source.replace('<p>Gone</p>', '<p/>'));
        });
    });

    suite('corpus fuzz', () => {
        /** Text nodes of a document with their positions (a sample of at most `max`). */
        function textNodes(doc: PMNode, max: number): { node: PMNode; pos: number }[] {
            const all: { node: PMNode; pos: number }[] = [];
            doc.descendants((node, pos) => {
                if (node.isText && node.text!.length > 1) {
                    all.push({ node, pos });
                }
                return true;
            });
            const step = Math.max(1, Math.floor(all.length / max));
            return all.filter((_, k) => k % step === 0).slice(0, max);
        }

        test('typing one character in any text of the corpus inserts exactly that character', () => {
            const failures: string[] = [];
            let edits = 0;
            for (const file of corpusFiles().filter((f) => f.endsWith('.dita'))) {
                const source = fs.readFileSync(file, 'utf8');
                const { doc, base } = load(source);
                for (const { node, pos } of textNodes(doc, 25)) {
                    const at = pos + Math.floor(node.text!.length / 2);
                    const tr = EditorState.create({ doc }).tr.insertText('Ж', at);
                    const out = serializeDocument(tr.doc, base);
                    const span = minimalEdit(source, out);
                    edits++;
                    if (!span || span.start !== span.end || span.text !== 'Ж') {
                        failures.push(`${path.basename(file)}@${at}: ${JSON.stringify(span)}`);
                    }
                }
            }
            assert.ok(edits > 500, `only ${edits} edits`);
            assert.deepStrictEqual(failures.slice(0, 20), []);
        });

        test('deleting one character removes exactly its source (an entity reference, or a whitespace run)', () => {
            const failures: string[] = [];
            for (const file of corpusFiles().filter((f) => f.endsWith('.dita'))) {
                const source = fs.readFileSync(file, 'utf8');
                const { doc, base } = load(source);
                for (const { node, pos } of textNodes(doc, 25)) {
                    const k = Math.floor(node.text!.length / 2);
                    const ch = node.text![k];
                    const tr = EditorState.create({ doc }).tr.delete(pos + k, pos + k + 1);
                    const out = serializeDocument(tr.doc, base);
                    const span = minimalEdit(source, out);
                    const removed = span ? source.slice(span.start, span.end) : '';
                    const ok = span !== null && span.text === ''
                        && (ch === ' ' ? /^\s+$/.test(removed) : decodeXmlText(removed) === ch);
                    // Removing one of two equal neighbours is ambiguous: the span may shift.
                    const ambiguous = span !== null && span.text === '' && decodeXmlText(removed).length === 1
                        && (node.text![k - 1] === ch || node.text![k + 1] === ch);
                    if (!ok && !ambiguous) {
                        failures.push(`${path.basename(file)}: removed ${JSON.stringify(removed)} for ${JSON.stringify(ch)}`);
                    }
                }
            }
            assert.deepStrictEqual(failures.slice(0, 20), []);
        });

        test('random edit sequences write a document that reads back as the edited one', () => {
            // Deterministic PRNG so failures reproduce; DITACRAFT_FUZZ_SEED / _RUNS / _STEPS
            // run it harder.
            let seed = Number(process.env.DITACRAFT_FUZZ_SEED) || 20261002;
            const runs = Number(process.env.DITACRAFT_FUZZ_RUNS) || 6;
            const steps = Number(process.env.DITACRAFT_FUZZ_STEPS) || 5;
            const rnd = (n: number): number => {
                seed = (seed * 1103515245 + 12345) & 0x7fffffff;
                return seed % n;
            };
            const markNames = ['b', 'i', 'u', 'codeph'].filter((n) => es.markType(n));
            const signature = (doc: PMNode): string => readingSignature(doc, es);
            const failures: string[] = [];
            let sequences = 0;
            for (const file of corpusFiles().filter((f) => f.endsWith('.dita'))) {
                const source = fs.readFileSync(file, 'utf8');
                const { doc, base } = load(source);
                for (let run = 0; run < runs; run++) {
                    const tr = EditorState.create({ doc }).tr;
                    const ops: string[] = [];
                    for (let step = 0; step < steps; step++) {
                        const texts: { node: PMNode; pos: number }[] = [];
                        tr.doc.descendants((node, pos) => {
                            if (node.isText) {
                                texts.push({ node, pos });
                            }
                            return true;
                        });
                        if (texts.length === 0) {
                            break;
                        }
                        const t = texts[rnd(texts.length)];
                        const at = t.pos + rnd(t.node.text!.length + 1);
                        const op = rnd(5);
                        try {
                            if (op === 0) {
                                tr.insertText(['x', ' y ', '&', '<', 'é'][rnd(5)], at);
                                ops.push(`insert@${at}`);
                            } else if (op === 1) {
                                const to = Math.min(tr.doc.content.size - 1, at + 1 + rnd(12));
                                const $a = tr.doc.resolve(at);
                                const $b = tr.doc.resolve(to);
                                if ($a.parent === $b.parent) {
                                    tr.delete(at, to);
                                    ops.push(`delete@${at}-${to}`);
                                }
                            } else if (op === 2 && markNames.length > 0) {
                                const to = Math.min(t.pos + t.node.text!.length, at + 1 + rnd(8));
                                const type = es.markType(markNames[rnd(markNames.length)])!;
                                if (rnd(2) === 0) {
                                    tr.addMark(at, to, type.create());
                                } else {
                                    tr.removeMark(at, to, type);
                                }
                                ops.push(`mark@${at}-${to}`);
                            } else if (op === 3 && tr.doc.resolve(at).parent.isTextblock && tr.doc.resolve(at).parent.type.name.endsWith('__text')) {
                                tr.split(at);
                                ops.push(`split@${at}`);
                            } else {
                                const to = Math.min(t.pos + t.node.text!.length, at + rnd(6));
                                tr.insertText('zz', at, to);
                                ops.push(`replace@${at}-${to}`);
                            }
                        } catch {
                            // ProseMirror refused the step (invalid structure): skip it.
                        }
                    }
                    sequences++;
                    let out = '';
                    try {
                        out = serializeDocument(tr.doc, base);
                        const reloaded = load(out).doc;
                        if (signature(reloaded) !== signature(tr.doc)) {
                            const a = signature(tr.doc);
                            const b = signature(reloaded);
                            let k = 0;
                            while (a[k] === b[k]) {
                                k++;
                            }
                            failures.push(`${path.basename(file)} [${ops.join(' ')}]: …${a.slice(Math.max(0, k - 40), k + 40)}… ≠ …${b.slice(Math.max(0, k - 40), k + 40)}…`);
                        }
                    } catch (error) {
                        failures.push(`${path.basename(file)} [${ops.join(' ')}]: ${(error as Error).message}`);
                    }
                }
            }
            assert.ok(sequences > 300, `only ${sequences} sequences`);
            assert.deepStrictEqual(failures.slice(0, 10), []);
        });

        test('splitting every paragraph of the corpus keeps the document well-formed', () => {
            const failures: string[] = [];
            for (const file of corpusFiles().filter((f) => f.endsWith('.dita'))) {
                const source = fs.readFileSync(file, 'utf8');
                const { doc, base } = load(source);
                const targets: number[] = [];
                doc.descendants((node, pos) => {
                    if (node.type.name === 'p__text' && node.content.size > 2) {
                        targets.push(pos + 1 + Math.floor(node.content.size / 2));
                    }
                    return true;
                });
                for (const at of targets.slice(0, 10)) {
                    const state = EditorState.create({ doc });
                    let out: string;
                    try {
                        out = serializeDocument(state.tr.split(at).doc, base);
                    } catch {
                        continue; // a split inside a phrase is refused by ProseMirror
                    }
                    try {
                        parse(out);
                    } catch (error) {
                        failures.push(`${path.basename(file)}@${at}: ${(error as Error).message}`);
                    }
                }
            }
            assert.deepStrictEqual(failures.slice(0, 20), []);
        });
    });
});
