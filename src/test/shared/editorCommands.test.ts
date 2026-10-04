/**
 * Visual Editor commands Test Suite (spec §13.3).
 *
 * Every command runs on a real DITA document and is checked through the source it writes
 * (the serializer of editor.test.ts): Enter, lists, Tab, styles, insertion, tables, and
 * the normalization that keeps the document in the editor's shapes.
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import type { Node as PMNode } from 'prosemirror-model';
import { joinBackward, joinForward } from 'prosemirror-commands';
import { type Command, EditorState, TextSelection } from 'prosemirror-state';
import { parse } from '../../shared/cst/parse';
import { DitaCommands } from '../../shared/editor/commands';
import { ImageCommands } from '../../shared/editor/images';
import { LinkCommands } from '../../shared/editor/links';
import { buildEditorSchema, type EditorSchema } from '../../shared/editor/schema';
import { buildDocument } from '../../shared/editor/toProseMirror';
import { serializeDocument } from '../../shared/editor/toSource';
import { readingSignature } from './editorHelpers';
import { corpusFiles, ditabaseGrammar } from './helpers';

let es: EditorSchema;
let cmds: DitaCommands;

function textPos(doc: PMNode, text: string, after = 0): number {
    let found = -1;
    doc.descendants((node, pos) => {
        if (found === -1 && node.isText && node.text!.includes(text)) {
            found = pos + node.text!.indexOf(text) + after;
        }
        return found === -1;
    });
    assert.notStrictEqual(found, -1, `"${text}" not found`);
    return found;
}

/** Run `command` with the cursor at `cursor(doc)`; return the written source. */
function run(source: string, cursor: (doc: PMNode) => number, command: Command, expectApplied = true): string {
    const { doc, base } = buildDocument(parse(source), es);
    let state = EditorState.create({ doc, selection: TextSelection.create(doc, cursor(doc)) });
    const applied = command(state, (tr) => {
        state = state.apply(tr);
    });
    assert.strictEqual(applied, expectApplied, 'command applicability');
    const fix = cmds.normalize(state);
    if (fix) {
        state = state.apply(fix);
    }
    const out = serializeDocument(state.doc, base);
    parse(out); // well-formed
    return out;
}

const wrap = (body: string) => `<topic id="t">\n  <title>T</title>\n  <body>\n${body}\n  </body>\n</topic>`;

/** Markup with layout whitespace between tags removed (new elements are pretty-printed). */
const compact = (xml: string) => xml.replace(/>\s+</g, '><');

suite('Visual Editor: commands (spec §13.3)', function () {
    this.timeout(60000);

    suiteSetup(() => {
        es = buildEditorSchema(ditabaseGrammar());
        cmds = new DitaCommands(es);
    });

    suite('Enter', () => {
        test('in a paragraph: two paragraphs, the second new (no @id)', () => {
            const out = run(wrap('    <p id="a">Hello world</p>'), (d) => textPos(d, 'world'), cmds.enter);
            assert.ok(out.includes('<p id="a">Hello </p>\n    <p>world</p>'), out);
        });

        test('in a list item: a new item; in an empty last item: a paragraph after the list', () => {
            let out = run(wrap('    <ul>\n      <li>One</li>\n    </ul>'), (d) => textPos(d, 'One', 3), cmds.enter);
            assert.ok(out.includes('<li>One</li>\n      <li/>'), out);
            out = run(wrap('    <ul>\n      <li>One</li>\n      <li></li>\n    </ul>'), (d) => textPos(d, 'One', 3) + 2, cmds.enter);
            assert.ok(out.includes('<li>One</li>\n    </ul>\n    <p/>'), out);
        });

        test('in a step\'s command: a new step', () => {
            const task = '<task id="k"><title>T</title><taskbody><steps>\n<step><cmd>Open the valve.</cmd></step>\n</steps></taskbody></task>';
            const out = run(task, (d) => textPos(d, 'the valve'), cmds.enter);
            assert.ok(out.includes('<step><cmd>Open </cmd></step>\n<step><cmd>the valve.</cmd></step>'), out);
        });

        test('in the text of a note: the rest becomes a paragraph inside the note', () => {
            const out = run(wrap('    <note>Mind the gap.</note>'), (d) => textPos(d, 'the gap'), cmds.enter);
            assert.ok(out.includes('<note>Mind <p>the gap.</p></note>'), out);
        });

        test('in a list item holding a nested list: the item splits', () => {
            const out = run(wrap('    <ul>\n      <li>Parent item<ul><li>Child</li></ul></li>\n    </ul>'), (d) => textPos(d, 'item'), cmds.enter);
            assert.ok(out.includes('<li>Parent </li>\n      <li>item<ul><li>Child</li></ul></li>'), out);
        });

        test('at the end of a title: a short description is started', () => {
            const out = run(wrap('    <p>x</p>'), (d) => textPos(d, 'T', 1), cmds.enter);
            assert.ok(/<title>T<\/title>\s*<shortdesc\/>/.test(out), out);
        });

        test('Backspace at the start of a paragraph joins it to the previous one', () => {
            const out = run(wrap('    <p>One</p>\n    <p>Two</p>'), (d) => textPos(d, 'Two'), joinBackward);
            assert.ok(out.includes('<p>OneTwo</p>') && !out.includes('<p>Two</p>'), out);
        });
    });

    suite('lists', () => {
        test('wrap paragraphs in a list, and back', () => {
            const source = wrap('    <p>One</p>');
            const out = run(source, (d) => textPos(d, 'One'), cmds.wrapInList('ul'));
            assert.ok(out.includes('    <ul>\n      <li>One</li>\n    </ul>'), out);
            const back = run(out, (d) => textPos(d, 'One'), cmds.unwrapList);
            assert.ok(back.includes('<p>One</p>') && !back.includes('<ul'), back);
        });

        test('Tab nests an item in the previous one; Shift+Tab brings it back', () => {
            const source = wrap('    <ul>\n      <li>One</li>\n      <li>Two</li>\n    </ul>');
            const nested = run(source, (d) => textPos(d, 'Two'), cmds.indentItem);
            assert.ok(compact(nested).includes('<li>One<ul><li>Two</li></ul></li></ul>'), nested);
            const back = run(nested, (d) => textPos(d, 'Two'), cmds.outdentItem);
            assert.ok(compact(back).includes('<ul><li>One</li><li>Two</li></ul>'), back);
        });

        test('the first item cannot be indented', () => {
            run(wrap('    <ul><li>One</li></ul>'), (d) => textPos(d, 'One'), cmds.indentItem, false);
        });
    });

    suite('styles and insertion', () => {
        test('Styles offer the textblocks valid here; a paragraph becomes a note', () => {
            const { doc } = buildDocument(parse(wrap('    <p>Body text</p>')), es);
            const state = EditorState.create({ doc, selection: TextSelection.create(doc, textPos(doc, 'Body')) });
            const styles = cmds.blockTypesAt(state);
            assert.ok(styles.includes('note') && styles.includes('lines') && !styles.includes('title'), styles.join(','));
            const out = run(wrap('    <p>Body text</p>'), (d) => textPos(d, 'Body'), cmds.setBlockType('note'));
            assert.ok(out.includes('<note>Body text</note>'), out);
        });

        test('Insert offers what the DTD allows after the current block', () => {
            const { doc } = buildDocument(parse(wrap('    <p>Body</p>')), es);
            const state = EditorState.create({ doc, selection: TextSelection.create(doc, textPos(doc, 'Body')) });
            const insertable = cmds.insertableAt(state);
            for (const name of ['p', 'ul', 'ol', 'note', 'table', 'fig', 'section', 'codeblock']) {
                assert.ok(insertable.includes(name), `${name} missing from ${insertable.join(',')}`);
            }
            assert.ok(!insertable.includes('title') && !insertable.includes('li'), insertable.join(','));
        });

        test('inserting a list writes it indented after the current block', () => {
            const out = run(wrap('    <p>Body</p>'), (d) => textPos(d, 'Body'), cmds.insertBlock('ul'));
            assert.ok(/<p>Body<\/p>\n {4}<ul>\n {6}<li\/>\n {4}<\/ul>/.test(out), out);
        });

        test('random command sequences over the corpus write documents that read back as edited', () => {
            const commands: [string, () => Command][] = [
                ['enter', () => cmds.enter], ['joinBackward', () => joinBackward], ['joinForward', () => joinForward],
                ['ul', () => cmds.wrapInList('ul')], ['ol', () => cmds.wrapInList('ol')], ['unwrap', () => cmds.unwrapList],
                ['indent', () => cmds.indentItem], ['outdent', () => cmds.outdentItem],
                ['insert p', () => cmds.insertBlock('p')], ['insert note', () => cmds.insertBlock('note')],
                ['table', () => cmds.insertTable(1, 2)], ['style note', () => cmds.setBlockType('note')],
                ['style p', () => cmds.setBlockType('p')],
                // Context menu commands.
                ['inline ph', () => cmds.insertInline('ph')], ['inline uicontrol', () => cmds.insertInline('uicontrol')],
                ['inline b', () => cmds.insertInline('b')], ['inline xref', () => cmds.insertInline('xref')],
                ['move up', () => cmds.moveElement(-1)], ['move down', () => cmds.moveElement(1)],
                ['unwrap element', () => cmds.unwrapElement], ['delete element', () => cmds.deleteElement],
                // Images.
                ['image inline', () => images.insert('inline', { href: 'img/a b.png', alt: 'A & B' })],
                ['image break', () => images.insert('break', { href: 'a.png' })],
                ['image figure', () => images.insert('figure', { href: 'a.png', alt: 'Fig' })],
                // Links.
                ['link', () => links.setLink({ href: 'other.dita#o/s1', title: 'Other' })],
                ['link key', () => links.setLink({ keyref: 'product' })],
                ['link web', () => links.setLink({ href: 'https://example.com/?a=1&b', scope: 'external', format: 'html' })],
                ['remove link', () => links.removeLink],
            ];
            const images = new ImageCommands(es, cmds);
            const links = new LinkCommands(es, cmds);
            let seed = Number(process.env.DITACRAFT_FUZZ_SEED) || 7;
            const rnd = (n: number): number => {
                seed = (seed * 1103515245 + 12345) & 0x7fffffff;
                return seed % n;
            };
            const signature = (doc: PMNode): string => readingSignature(doc, es);
            const failures: string[] = [];
            let applied = 0;
            for (const file of corpusFiles().filter((f) => f.endsWith('.dita'))) {
                const source = fs.readFileSync(file, 'utf8');
                const { doc, base } = buildDocument(parse(source), es);
                for (let run = 0; run < 3; run++) {
                    let state = EditorState.create({ doc });
                    for (let step = 0; step < 8; step++) {
                        // A cursor, or now and then a selection inside one paragraph.
                        const positions: [number, number][] = [];
                        state.doc.descendants((node, pos) => {
                            if (node.isTextblock) {
                                const a = rnd(node.content.size + 1);
                                const b = rnd(3) === 0 ? rnd(node.content.size + 1) : a;
                                positions.push([pos + 1 + Math.min(a, b), pos + 1 + Math.max(a, b)]);
                            }
                            return true;
                        });
                        if (positions.length === 0) {
                            break;
                        }
                        const [from, to] = positions[rnd(positions.length)];
                        let selection: TextSelection;
                        try {
                            selection = TextSelection.create(state.doc, from, to);
                        } catch {
                            selection = TextSelection.create(state.doc, from);
                        }
                        state = state.apply(state.tr.setSelection(selection));
                        const [name, make] = commands[rnd(commands.length)];
                        if (!make()(state, (tr) => {
                            state = state.apply(tr);
                        })) {
                            continue;
                        }
                        const fix = cmds.normalize(state);
                        if (fix) {
                            state = state.apply(fix);
                        }
                        applied++;
                        try {
                            const reloaded = buildDocument(parse(serializeDocument(state.doc, base)), es).doc;
                            if (signature(reloaded) !== signature(state.doc)) {
                                failures.push(`${path.basename(file)}: ${name} reads back differently`);
                            }
                        } catch (error) {
                            failures.push(`${path.basename(file)}: ${name}: ${(error as Error).message}`);
                        }
                    }
                }
            }
            assert.ok(applied > 300, `only ${applied} commands applied`);
            assert.deepStrictEqual(failures.slice(0, 10), []);
        });

        test('a table with a header row and its column specifications', () => {
            const out = run(wrap('    <p>Body</p>'), (d) => textPos(d, 'Body'), cmds.insertTable(2, 3));
            assert.ok(out.includes('<tgroup cols="3">'), out);
            assert.strictEqual((out.match(/<colspec /g) ?? []).length, 3, out);
            assert.strictEqual((out.match(/<row>/g) ?? []).length, 3, out);
            assert.strictEqual((out.match(/<entry\/>/g) ?? []).length, 9, out);
        });
    });
});
