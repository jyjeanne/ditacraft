/**
 * Visual Editor: maps Test Suite (spec §13.8).
 *
 * Maps and bookmaps open in the visual editor as rows: every corpus map is written back byte
 * for byte; a row says what it is (label, kind, target) by the documented order; the host
 * resolves each row's target to its title; the structure commands work on a selected row; rows
 * are indented, outdented and dragged where the DTD allows (re-indented in the source), pointed
 * at a new target, added from a target, and given a label (M2); relationship tables keep their
 * grid through row and column commands, and their cells take references (M3); and random edits
 * on rows of the corpus maps read back as edited.
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { DOMOutputSpec, Node as PMNode } from 'prosemirror-model';
import { type Command, EditorState, NodeSelection, TextSelection } from 'prosemirror-state';
import { parse } from '../../shared/cst/parse';
import { DitaCommands } from '../../shared/editor/commands';
import { contextMenu, findItem, type MenuContext } from '../../shared/editor/contextMenu';
import { ImageCommands } from '../../shared/editor/images';
import { LinkCommands } from '../../shared/editor/links';
import { MapCommands } from '../../shared/editor/mapCommands';
import { RelTableCommands } from '../../shared/editor/relTables';
import { TableCommands } from '../../shared/editor/tables';
import {
    hiddenMetadataSelection, isMapDocument, isMapRow, mapRowDom, mapRowInfo, mapRows, mapRowTarget, rowAtPath, rowPath, selectedRow,
} from '../../shared/editor/maps';
import { resolvedTargets } from '../../shared/editor/reused';
import { buildEditorSchema, type EditorSchema } from '../../shared/editor/schema';
import { buildDocument } from '../../shared/editor/toProseMirror';
import { serializeDocument } from '../../shared/editor/toSource';
import { compileGrammar } from '../../shared/grammar/compiler';
import { readDtdGrammar } from '../../shared/grammar/typesxmlAdapter';
import { labelsFor } from '../../shared/render/labels';
import { mapRowItems } from '../../editor/reusedContent';
import { ReferenceResolver, type KeyDefinitionLike } from '../../preview/resolver';
import { readingSignature } from './editorHelpers';
import { corpusFiles, DTDS_DIR } from './helpers';

let mapEs: EditorSchema;
let bookEs: EditorSchema;

function compile(shell: string, id: string): EditorSchema {
    const { raw } = readDtdGrammar(path.join(DTDS_DIR, ...shell.split('/')), path.join(DTDS_DIR, 'catalog.xml'));
    return buildEditorSchema(compileGrammar(raw, { id, ditaVersion: '1.3', shell, publicIds: [] }));
}

function schemaFor(source: string): EditorSchema {
    return /<bookmap[\s>]/.test(source) ? bookEs : mapEs;
}

const MAP = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE map PUBLIC "-//OASIS//DTD DITA Map//EN" "map.dtd">',
    '<map id="m">',
    '  <title>Field Guide</title>',
    '  <topichead navtitle="Getting started">',
    '    <topicref href="topics/install.dita">',
    '      <topicmeta>',
    '        <navtitle>Install it</navtitle>',
    '      </topicmeta>',
    '      <topicref href="topics/first.dita"/>',
    '    </topicref>',
    '    <topicref href="topics/missing.dita"/>',
    '  </topichead>',
    '  <keydef keys="product">',
    '    <topicmeta>',
    '      <keywords>',
    '        <keyword>Field Kit</keyword>',
    '      </keywords>',
    '    </topicmeta>',
    '  </keydef>',
    '  <topicref keyref="setup"/>',
    '  <mapref href="sub.ditamap"/>',
    '  <topicgroup>',
    '    <topicref href="https://example.com/" scope="external" format="html"/>',
    '  </topicgroup>',
    '</map>',
    '',
].join('\n');

const NEST_REL = ['<map>', '  <title>Nest</title>', '  <topicref href="a.dita"/>', '  <topicref href="b.dita">', '    <topicref href="c.dita"/>',
    '  </topicref>', '  <topicref href="d.dita"/>', '</map>', ''].join('\n');

/** The rows of `source` (built with its grammar), with what they show. */
function rowsOf(source: string, es = mapEs): { doc: PMNode; rows: { pos: number; node: PMNode }[] } {
    const { doc } = buildDocument(parse(source), es);
    return { doc, rows: mapRows(doc, es) };
}

/** The position of the row whose attribute `name` is `value`. */
function rowWith(doc: PMNode, es: EditorSchema, name: string, value: string): number {
    const row = mapRows(doc, es).find(({ node }) => (node.attrs.xml as [string, string][]).some(([n, v]) => n === name && v === value));
    assert.ok(row, `no row with ${name}="${value}"`);
    return row.pos;
}

/** Run `command` with the row at `pick(doc)` selected; return the written source and the state after. */
function onRow(source: string, pick: (doc: PMNode) => number, command: Command, es = mapEs): { out: string; state: EditorState } {
    const { doc, base } = buildDocument(parse(source), es);
    let state = EditorState.create({ doc, selection: NodeSelection.create(doc, pick(doc)) });
    assert.ok(command(state, (tr) => {
        state = state.apply(tr);
    }), 'command applies');
    const out = serializeDocument(state.doc, base);
    parse(out); // well-formed
    return { out, state };
}

/** The class attribute of a DOM spec's top element. */
function specClass(spec: DOMOutputSpec): string {
    const attrs = (spec as unknown[])[1] as Record<string, string>;
    return attrs.class;
}

suite('Visual Editor: maps (spec §13.8)', function () {
    this.timeout(180000);

    suiteSetup(() => {
        mapEs = compile('technicalContent/dtd/map.dtd', 'dita-1.3/map');
        bookEs = compile('bookmap/dtd/bookmap.dtd', 'dita-1.3/bookmap');
    });

    test('every corpus map and bookmap is written back byte for byte', () => {
        const failures: string[] = [];
        let checked = 0;
        for (const file of corpusFiles().filter((f) => /\.(ditamap|bookmap)$/i.test(f))) {
            const source = fs.readFileSync(file, 'utf8');
            try {
                const es = schemaFor(source);
                const { doc, base } = buildDocument(parse(source), es);
                if (serializeDocument(doc, base) !== source) {
                    failures.push(path.basename(file));
                }
                assert.ok(isMapDocument(doc, es), `${path.basename(file)} is a map`);
                checked++;
            } catch (error) {
                failures.push(`${path.basename(file)}: ${(error as Error).message}`);
            }
        }
        assert.ok(checked >= 15, `only ${checked} maps`);
        assert.deepStrictEqual(failures, []);
    });

    suite('rows', () => {
        test('references are rows; titles and metadata are not', () => {
            const { doc, rows } = rowsOf(MAP);
            const names = rows.map(({ node }) => mapEs.role(node.type)?.element);
            assert.deepStrictEqual(names, ['topichead', 'topicref', 'topicref', 'topicref', 'keydef', 'topicref', 'mapref', 'topicgroup', 'topicref']);
            assert.strictEqual(isMapRow(doc.firstChild!.firstChild!, mapEs), false); // the title
        });

        test('a row\'s label: navtitle, then @navtitle, then the resolved title, a key\'s text, the target', () => {
            const { doc } = rowsOf(MAP);
            const info = (name: string, value: string, resolved?: { text?: string; error?: string }) =>
                mapRowInfo(doc.nodeAt(rowWith(doc, mapEs, name, value))!, mapEs, resolved);
            assert.deepStrictEqual(info('navtitle', 'Getting started'), {
                element: 'topichead', label: 'Getting started', labelFrom: 'attribute', target: undefined, keys: undefined, parent: true,
            });
            const install = info('href', 'topics/install.dita', { text: 'Installing the kit' });
            assert.strictEqual(install.label, 'Install it', 'the navtitle wins over the target\'s title');
            assert.strictEqual(install.labelFrom, 'navtitle');
            assert.strictEqual(install.target, 'topics/install.dita');
            assert.strictEqual(install.parent, true);
            assert.deepStrictEqual([info('href', 'topics/first.dita').label, info('href', 'topics/first.dita').labelFrom], ['topics/first.dita', 'target']);
            const titled = info('href', 'topics/first.dita', { text: 'First  steps' });
            assert.deepStrictEqual([titled.label, titled.labelFrom, titled.target], ['First steps', 'title', 'topics/first.dita']);
            const broken = info('href', 'topics/missing.dita', { error: 'cannot read missing.dita' });
            assert.deepStrictEqual([broken.label, broken.labelFrom], ['topics/missing.dita', 'target']);
            const key = info('keys', 'product');
            assert.deepStrictEqual([key.label, key.labelFrom, key.keys], ['Field Kit', 'keyword', 'product']);
            assert.deepStrictEqual([info('keyref', 'setup').label, info('keyref', 'setup').labelFrom], ['[setup]', 'target']);
            const group = mapRowInfo(mapRows(doc, mapEs).find(({ node }) => node.type.name.startsWith('topicgroup'))!.node, mapEs);
            assert.deepStrictEqual([group.label, group.labelFrom, group.parent], ['', 'none', true]);
        });

        test('a row\'s target, as Open target uses it', () => {
            const { doc } = rowsOf(MAP);
            const target = (name: string, value: string) => mapRowTarget(doc.nodeAt(rowWith(doc, mapEs, name, value))!, mapEs);
            assert.deepStrictEqual(target('href', 'topics/install.dita'), { href: 'topics/install.dita', keyref: undefined, scope: undefined, format: undefined });
            assert.deepStrictEqual(target('keyref', 'setup'), { href: undefined, keyref: 'setup', scope: undefined, format: undefined });
            assert.deepStrictEqual(target('href', 'https://example.com/'), { href: 'https://example.com/', keyref: undefined, scope: 'external', format: 'html' });
            assert.strictEqual(target('navtitle', 'Getting started'), undefined);
            const navref = buildDocument(parse('<map><navref mapref="other.ditamap"/><anchor id="a1"/></map>'), mapEs).doc;
            const [nav, anchor] = mapRows(navref, mapEs);
            assert.deepStrictEqual(mapRowTarget(nav.node, mapEs), { href: 'other.ditamap', format: 'ditamap' });
            assert.strictEqual(mapRowTarget(anchor.node, mapEs), undefined);
            assert.strictEqual(mapRowInfo(anchor.node, mapEs).label, '⚓ a1');
        });

        test('a row\'s DOM: a line that is not editable, then the rows it holds; kinds and labels as classes', () => {
            const { doc } = rowsOf(MAP);
            const labels = labelsFor('en');
            const node = doc.nodeAt(rowWith(doc, mapEs, 'href', 'topics/install.dita'))!;
            const spec = mapRowDom(mapEs.facts('topicref')!, node, mapEs, labels, { text: 'Installing', from: 'install.dita' }) as unknown[];
            assert.strictEqual(spec[0], 'div');
            assert.ok(specClass(spec as DOMOutputSpec).split(' ').includes('dc-maprow-parent'));
            const line = spec[2] as unknown[];
            assert.deepStrictEqual([line[0], (line[1] as Record<string, string>).contenteditable, (line[1] as Record<string, string>).title], ['div', 'false', 'topicref → install.dita']);
            assert.ok(JSON.stringify(line).includes('"Install it"'));
            assert.deepStrictEqual(spec[3], ['div', { class: 'dc-maprow-body' }, 0]);
            // The kind of a plain reference goes without saying; others are named.
            assert.ok(!JSON.stringify(line).includes('dc-maprow-kind'));
            const head = doc.nodeAt(rowWith(doc, mapEs, 'navtitle', 'Getting started'))!;
            assert.ok(JSON.stringify(mapRowDom(mapEs.facts('topichead')!, head, mapEs, labels)).includes('["span",{"class":"dc-maprow-kind"},"topichead"]'));
            // A key's name is shown; a row with nothing to show says so.
            const keydef = doc.nodeAt(rowWith(doc, mapEs, 'keys', 'product'))!;
            assert.ok(JSON.stringify(mapRowDom(mapEs.facts('keydef')!, keydef, mapEs, labels)).includes('"dc-maprow-keys"'));
            const empty = buildDocument(parse('<map><topicref/></map>'), mapEs).doc;
            assert.ok(JSON.stringify(mapRowDom(mapEs.facts('topicref')!, mapRows(empty, mapEs)[0].node, mapEs, labels)).includes('"no target"'));
        });

        test('the schema draws rows, hides a reference\'s metadata, and draws a map title and reltable', () => {
            const { doc } = rowsOf(MAP);
            const map = doc.firstChild!;
            assert.ok(specClass(map.type.spec.toDOM!(map)).split(' ').includes('map'));
            const row = doc.nodeAt(rowWith(doc, mapEs, 'href', 'topics/install.dita'))!;
            assert.ok(specClass(row.type.spec.toDOM!(row)).startsWith('dc-maprow'));
            const meta = row.firstChild!;
            assert.strictEqual(mapEs.role(meta.type)?.element, 'topicmeta');
            assert.ok(specClass(meta.type.spec.toDOM!(meta)).split(' ').includes('dc-markup'));
            const rel = buildDocument(parse('<map><reltable><relrow><relcell><topicref href="a.dita"/></relcell></relrow></reltable></map>'), mapEs).doc.firstChild!.firstChild!;
            assert.strictEqual((rel.type.spec.toDOM!(rel) as unknown[])[0], 'table');
        });

        test('a bookmap: its main title, chapters and book lists', () => {
            const source = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'docs', 'user-guide', 'ditacraft-user-guide.bookmap'), 'utf8');
            const { doc, rows } = rowsOf(source, bookEs);
            const kinds = new Set(rows.map(({ node }) => bookEs.role(node.type)?.element));
            for (const kind of ['frontmatter', 'booklists', 'toc', 'part', 'chapter', 'appendix', 'backmatter', 'indexlist']) {
                assert.ok(kinds.has(kind), `${kind} is a row`);
            }
            const chapter = rows.find(({ node }) => bookEs.role(node.type)?.element === 'chapter')!;
            assert.strictEqual(mapRowInfo(chapter.node, bookEs).labelFrom, 'navtitle');
            assert.ok(specClass(mapRowDom(bookEs.facts('chapter')!, chapter.node, bookEs, labelsFor('en'))).includes('dc-row-chapter'));
            // The book's metadata is hidden like a reference's.
            const bookmeta = doc.firstChild!.child(1);
            assert.strictEqual(bookEs.role(bookmeta.type)?.element, 'bookmeta');
            assert.ok(specClass(bookmeta.type.spec.toDOM!(bookmeta)).includes('dc-markup'));
        });

        test('a row\'s place in the tree finds it again (folds survive a rebuild)', () => {
            const { doc, rows } = rowsOf(MAP);
            for (const { pos } of rows) {
                assert.strictEqual(rowAtPath(doc, rowPath(doc, pos), mapEs), pos);
            }
            assert.strictEqual(rowAtPath(doc, '0/0', mapEs), undefined, 'the title is not a row');
            assert.strictEqual(rowAtPath(doc, '0/99', mapEs), undefined);
            const head = rowWith(doc, mapEs, 'navtitle', 'Getting started');
            const hidden = mapRows(doc, mapEs, (pos) => pos === head).filter((r) => r.hidden).map((r) => mapRowInfo(r.node, mapEs).label);
            assert.deepStrictEqual(hidden, ['Install it', 'topics/first.dita', 'topics/missing.dita']);
        });

        test('the cursor is not left in a reference\'s hidden metadata: its row is selected', () => {
            const { doc } = buildDocument(parse(MAP), mapEs);
            let at = -1;
            doc.descendants((node, pos) => {
                if (at === -1 && node.isText && node.text === 'Install it') {
                    at = pos + 2;
                }
                return at === -1;
            });
            const state = EditorState.create({ doc, selection: TextSelection.create(doc, at) });
            const fix = hiddenMetadataSelection(state, mapEs);
            assert.ok(fix instanceof NodeSelection);
            assert.strictEqual(fix.from, rowWith(doc, mapEs, 'href', 'topics/install.dita'));
            assert.strictEqual(selectedRow(state.apply(state.tr.setSelection(fix)), mapEs)?.pos, fix.from);
            // The map title is a fine place.
            const title = EditorState.create({ doc, selection: TextSelection.create(doc, 3) });
            assert.strictEqual(hiddenMetadataSelection(title, mapEs), undefined);
        });
    });

    suite('resolved targets', () => {
        test('row items go to their rows (positions through a fresh build)', () => {
            const { doc } = buildDocument(parse(MAP), mapEs);
            const fresh = buildDocument(parse(MAP), mapEs);
            const offset = MAP.indexOf('<topicref href="topics/first.dita"/>');
            const keyOffset = MAP.indexOf('<topicref keyref="setup"/>');
            const targets = resolvedTargets(doc, fresh, [
                { offset, kind: 'row', text: 'First steps' },
                { offset: keyOffset, kind: 'key', text: 'Setup' }, // a key's text is for an element kept whole, not a row
            ], mapEs);
            assert.deepStrictEqual(targets.map((t) => [t.pos, t.item.text]), [[rowWith(doc, mapEs, 'href', 'topics/first.dita'), 'First steps']]);
        });

        test('the host resolves each row to its topic\'s or map\'s title, or says why not', async () => {
            const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-maps-'));
            const write = (rel: string, text: string) => {
                fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
                fs.writeFileSync(path.join(dir, rel), text);
            };
            write('topics/a.dita', '<topic id="a"><title>Alpha <b>topic</b></title></topic>');
            write('topics/b.dita', '<dita><topic id="b1"><title>Beta one</title></topic><topic id="b2"><title>Beta two</title></topic></dita>');
            write('sub.ditamap', '<map title="Sub map (attribute)"><topicref href="topics/a.dita"/></map>');
            write('book.bookmap', '<bookmap><booktitle><booklibrary>Library</booklibrary><mainbooktitle>The Book</mainbooktitle></booktitle></bookmap>');
            const source = [
                '<map>',
                '<topicref href="topics/a.dita"/>',
                '<topicref href="topics/b.dita"/>',
                '<topicref href="topics/b.dita#b2"/>',
                '<topicref href="topics/missing.dita"/>',
                '<mapref href="sub.ditamap"/>',
                '<topicref href="book.bookmap" format="ditamap"/>',
                '<topicref href="https://example.com/" scope="external" format="html"/>',
                '<topicref href="guide.pdf" format="pdf"/>',
                '<topicref keyref="k-alpha"/>',
                '<topicref keyref="k-nav"/>',
                '<topicref keyref="k-none"/>',
                '<topicref keyref="k-none" href="topics/b.dita#b1"/>',
                '<navref mapref="sub.ditamap"/>',
                '<keydef keys="text-only"><topicmeta><keywords><keyword>Kit</keyword></keywords></topicmeta></keydef>',
                '<topicref conref="other.ditamap#m/r"/>',
                '</map>',
            ].join('\n');
            write('main.ditamap', source);
            const keys: Record<string, KeyDefinitionLike> = {
                'k-alpha': { keyName: 'k-alpha', targetFile: path.join(dir, 'topics', 'a.dita') },
                'k-nav': { keyName: 'k-nav', targetFile: path.join(dir, 'topics', 'a.dita'), metadata: { navtitle: 'Alpha (from the key)' } },
            };
            const resolver = new ReferenceResolver({
                files: { readText: async (p) => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null) },
                keys: { resolveKey: async (key) => keys[key] ?? null },
                classOf: (name) => mapEs.grammar.elements[name]?.class,
            });
            const deps = new Set<string>();
            const doc = parse(source);
            const items = await mapRowItems(doc, resolver, path.join(dir, 'main.ditamap'), deps);
            const lineOf = (offset: number) => source.slice(0, offset).split('\n').length - 1;
            const shown = items.map((i) => `${lineOf(i.offset)}: ${i.text ?? `⚠ ${i.error}`}`);
            assert.deepStrictEqual(shown, [
                '1: Alpha topic',
                '2: Beta one',
                '3: Beta two',
                '4: ⚠ cannot read missing.dita',
                '5: Sub map (attribute)',
                '6: The Book',
                '9: Alpha topic',
                '10: Alpha (from the key)',
                '11: ⚠ key "k-none" is not defined',
                '12: Beta one',
                '13: Sub map (attribute)',
            ]);
            assert.strictEqual(items.find((i) => lineOf(i.offset) === 9)?.from, 'k-alpha → a.dita');
            assert.ok([...deps].some((d) => d.endsWith('missing.dita')), 'a missing target is watched (it may be created)');
            fs.rmSync(dir, { recursive: true, force: true });
        });
    });

    suite('structure commands on a selected row', () => {
        let cmds: DitaCommands;
        suiteSetup(() => {
            cmds = new DitaCommands(mapEs);
        });

        test('Insert after offers the references the DTD allows after the row', () => {
            const { doc } = buildDocument(parse(MAP), mapEs);
            const state = EditorState.create({ doc, selection: NodeSelection.create(doc, rowWith(doc, mapEs, 'href', 'topics/missing.dita')) });
            const names = cmds.insertableAt(state);
            for (const name of ['topicref', 'topichead', 'topicgroup', 'keydef', 'mapref']) {
                assert.ok(names.includes(name), `${name} in ${names.join(',')}`);
            }
            assert.ok(!names.includes('title') && !names.includes('topicmeta'), names.join(','));
        });

        test('a new reference goes right after the selected row (not after its parent), selected', () => {
            const { out, state } = onRow(MAP, (d) => rowWith(d, mapEs, 'href', 'topics/first.dita'), cmds.insertBlock('topicref'));
            assert.ok(out.includes('<topicref href="topics/first.dita"/>\n      <topicref/>\n    </topicref>'), out);
            assert.ok(state.selection instanceof NodeSelection && state.selection.node.childCount === 0);
            assert.strictEqual(mapEs.role((state.selection as NodeSelection).node.type)?.element, 'topicref');
        });

        test('move up, move down and delete a row', () => {
            const up = onRow(MAP, (d) => rowWith(d, mapEs, 'href', 'topics/missing.dita'), cmds.moveElement(-1)).out;
            assert.ok(up.indexOf('topics/missing.dita') < up.indexOf('topics/install.dita'), up);
            const down = onRow(MAP, (d) => rowWith(d, mapEs, 'keys', 'product'), cmds.moveElement(1)).out;
            assert.ok(down.indexOf('keyref="setup"') < down.indexOf('keys="product"'), down);
            const deleted = onRow(MAP, (d) => rowWith(d, mapEs, 'keys', 'product'), cmds.deleteElement).out;
            assert.ok(!deleted.includes('keys="product"') && !deleted.includes('Field Kit'), deleted);
            assert.ok(deleted.includes('  </topichead>\n  <topicref keyref="setup"/>'), deleted);
        });

        test('random structure edits on the rows of the corpus maps read back as edited', () => {
            let seed = Number(process.env.DITACRAFT_FUZZ_SEED) || 11;
            const rnd = (n: number): number => {
                seed = (seed * 1103515245 + 12345) & 0x7fffffff;
                return seed % n;
            };
            const failures: string[] = [];
            let applied = 0;
            for (const file of corpusFiles().filter((f) => /\.(ditamap|bookmap)$/i.test(f))) {
                const source = fs.readFileSync(file, 'utf8');
                const es = schemaFor(source);
                const c = new DitaCommands(es);
                const m = new MapCommands(es, c);
                const commands: [string, (state: EditorState) => Command | undefined][] = [
                    ['indent', () => m.indentRow], ['outdent', () => m.outdentRow],
                    ['drag', (state) => {
                        const rows = mapRows(state.doc, es);
                        const from = (state.selection as NodeSelection).from;
                        const target = rows[rnd(rows.length)].pos;
                        const to = m.dropPosition(state.doc, from, target, (['before', 'after', 'inside'] as const)[rnd(3)]);
                        return to === undefined ? undefined : m.moveRow(from, to);
                    }],
                    ['label', (state) => m.setLabel((state.selection as NodeSelection).from, ['Overview & <scope>', '', 'Étape 2'][rnd(3)])],
                    ['target', () => m.setTarget(rnd(2) === 0 ? { href: 'topics/a b.dita' } : { keyref: 'some-key' })],
                    ['reference', () => m.insertReference({ href: 'new/topic.dita' })],
                    ['insert topicref', () => c.insertBlock('topicref')],
                    ['insert topichead', () => c.insertBlock('topichead')],
                    ['insert any', (state) => {
                        const names = c.insertableAt(state);
                        return names.length > 0 ? c.insertBlock(names[rnd(names.length)]) : undefined;
                    }],
                    ['move up', () => c.moveElement(-1)], ['move down', () => c.moveElement(1)],
                    ['delete', () => c.deleteElement], ['unwrap', () => c.unwrapElement],
                ];
                const { doc, base } = buildDocument(parse(source), es);
                for (let run = 0; run < 3; run++) {
                    let state = EditorState.create({ doc });
                    for (let step = 0; step < 8; step++) {
                        const rows = mapRows(state.doc, es);
                        if (rows.length === 0) {
                            break;
                        }
                        state = state.apply(state.tr.setSelection(NodeSelection.create(state.doc, rows[rnd(rows.length)].pos)));
                        const [name, make] = commands[rnd(commands.length)];
                        const command = make(state);
                        if (!command || !command(state, (tr) => {
                            state = state.apply(tr);
                        })) {
                            continue;
                        }
                        const fix = c.normalize(state);
                        if (fix) {
                            state = state.apply(fix);
                        }
                        applied++;
                        try {
                            const reloaded = buildDocument(parse(serializeDocument(state.doc, base)), es).doc;
                            if (readingSignature(reloaded, es) !== readingSignature(state.doc, es)) {
                                failures.push(`${path.basename(file)}: ${name} reads back differently`);
                            }
                        } catch (error) {
                            failures.push(`${path.basename(file)}: ${name}: ${(error as Error).message}`);
                        }
                    }
                }
            }
            assert.ok(applied > 250, `only ${applied} commands applied`);
            assert.deepStrictEqual(failures.slice(0, 10), []);
        });
    });

    suite('editing rows (M2)', () => {
        let cmds: DitaCommands;
        let maps: MapCommands;
        suiteSetup(() => {
            cmds = new DitaCommands(mapEs);
            maps = new MapCommands(mapEs, cmds);
        });

        const NEST = ['<map>', '  <title>Nest</title>', '  <topicref href="a.dita"/>', '  <topicref href="b.dita">', '    <topicref href="c.dita"/>',
            '  </topicref>', '  <topicref href="d.dita"/>', '</map>', ''].join('\n');

        test('Tab puts the row in the row before it; a row with rows is re-indented as a whole', () => {
            const { out } = onRow(NEST, (d) => rowWith(d, mapEs, 'href', 'b.dita'), maps.indentRow);
            assert.strictEqual(out, ['<map>', '  <title>Nest</title>', '  <topicref href="a.dita">', '    <topicref href="b.dita">',
                '      <topicref href="c.dita"/>', '    </topicref>', '  </topicref>', '  <topicref href="d.dita"/>', '</map>', ''].join('\n'));
            // Into a row that already has rows: after them.
            const second = onRow(MAP, (d) => rowWith(d, mapEs, 'href', 'topics/missing.dita'), maps.indentRow).out;
            assert.ok(second.includes(['      <topicref href="topics/first.dita"/>', '      <topicref href="topics/missing.dita"/>', '    </topicref>',
                '  </topichead>'].join('\n')), second);
        });

        test('Shift+Tab puts the row after the row holding it; back where it was, the source is as it was', () => {
            const out = onRow(NEST, (d) => rowWith(d, mapEs, 'href', 'c.dita'), maps.outdentRow).out;
            assert.strictEqual(out, ['<map>', '  <title>Nest</title>', '  <topicref href="a.dita"/>', '  <topicref href="b.dita"/>',
                '  <topicref href="c.dita"/>', '  <topicref href="d.dita"/>', '</map>', ''].join('\n'));
            // Indent then outdent: byte for byte.
            const { doc, base } = buildDocument(parse(NEST), mapEs);
            let state = EditorState.create({ doc, selection: NodeSelection.create(doc, rowWith(doc, mapEs, 'href', 'b.dita')) });
            for (const command of [maps.indentRow, maps.outdentRow]) {
                assert.ok(command(state, (tr) => {
                    state = state.apply(tr);
                }));
            }
            assert.strictEqual(serializeDocument(state.doc, base), NEST);
        });

        test('the DTD decides: no Tab into a map reference, no Shift+Tab at the top, not the first row', () => {
            const { doc } = buildDocument(parse(MAP), mapEs);
            const at = (name: string, value: string) => EditorState.create({ doc, selection: NodeSelection.create(doc, rowWith(doc, mapEs, name, value)) });
            const group = mapRows(doc, mapEs).find(({ node }) => mapEs.role(node.type)?.element === 'topicgroup')!;
            assert.strictEqual(maps.indentRow(EditorState.create({ doc, selection: NodeSelection.create(doc, group.pos) })), false, 'a mapref holds no references');
            assert.strictEqual(maps.indentRow(at('keyref', 'setup')), true, 'a keydef may hold references');
            assert.strictEqual(maps.outdentRow(at('keyref', 'setup')), false, 'already at the top');
            assert.strictEqual(maps.indentRow(at('navtitle', 'Getting started')), false, 'no row before it');
            assert.strictEqual(maps.indentRow(at('href', 'sub.ditamap')), true);
        });

        test('dragging: before, after or inside a row, never into itself', () => {
            const { doc } = buildDocument(parse(NEST), mapEs);
            const pos = (href: string) => rowWith(doc, mapEs, 'href', href);
            assert.strictEqual(maps.dropPosition(doc, pos('d.dita'), pos('a.dita'), 'before'), pos('a.dita'));
            assert.strictEqual(maps.dropPosition(doc, pos('d.dita'), pos('c.dita'), 'inside'), pos('c.dita') + doc.nodeAt(pos('c.dita'))!.nodeSize - 1);
            assert.strictEqual(maps.dropPosition(doc, pos('b.dita'), pos('c.dita'), 'after'), undefined, 'into itself');
            assert.strictEqual(maps.dropPosition(doc, pos('a.dita'), pos('b.dita'), 'before'), undefined, 'where it is');
            const out = onRow(NEST, (d) => rowWith(d, mapEs, 'href', 'd.dita'), maps.moveRow(pos('d.dita'), pos('a.dita'))).out;
            assert.ok(out.includes('  <title>Nest</title>\n  <topicref href="d.dita"/>\n  <topicref href="a.dita"/>'), out);
            const inside = onRow(NEST, (d) => rowWith(d, mapEs, 'href', 'a.dita'), maps.moveRow(pos('a.dita'), maps.dropPosition(doc, pos('a.dita'), pos('c.dita'), 'inside')!)).out;
            assert.ok(inside.includes('    <topicref href="c.dita">\n      <topicref href="a.dita"/>\n    </topicref>'), inside);
        });

        test('Change target: href or keyref, scope and format replaced, the other attributes kept', () => {
            const out = onRow(MAP, (d) => rowWith(d, mapEs, 'href', 'topics/missing.dita'), maps.setTarget({ href: 'topics/found.dita', title: 'Found' })).out;
            assert.ok(out.includes('<topicref href="topics/found.dita"/>') && !out.includes('missing'), out);
            const key = onRow(MAP, (d) => rowWith(d, mapEs, 'href', 'sub.ditamap'), maps.setTarget({ keyref: 'sub-map' })).out;
            assert.ok(key.includes('<mapref keyref="sub-map"/>'), key);
            const keydef = onRow(MAP, (d) => rowWith(d, mapEs, 'keys', 'product'), maps.setTarget({ href: 'kit.dita' })).out;
            assert.ok(keydef.includes('<keydef keys="product" href="kit.dita">'), keydef);
        });

        test('Add reference: after the selected row, of the row\'s own kind when it is a reference; selected', () => {
            const { out, state } = onRow(MAP, (d) => rowWith(d, mapEs, 'href', 'topics/first.dita'), maps.insertReference({ href: 'topics/second.dita', title: 'Second' }));
            assert.ok(out.includes('      <topicref href="topics/first.dita"/>\n      <topicref href="topics/second.dita"/>\n'), out);
            assert.ok(state.selection instanceof NodeSelection);
            assert.strictEqual(maps.referenceElement(EditorState.create({ doc: buildDocument(parse(MAP), mapEs).doc })), 'topicref');
            // In a bookmap, after a chapter: a chapter.
            const book = '<bookmap><booktitle><mainbooktitle>B</mainbooktitle></booktitle>\n  <chapter href="one.dita"/>\n</bookmap>';
            const bookMaps = new MapCommands(bookEs, new DitaCommands(bookEs));
            const chapter = onRow(book, (d) => rowWith(d, bookEs, 'href', 'one.dita'), bookMaps.insertReference({ href: 'two.ditamap', format: 'ditamap' }), bookEs).out;
            assert.ok(chapter.includes('<chapter href="one.dita"/>\n  <chapter href="two.ditamap" format="ditamap"/>'), chapter);
        });

        test('a label: the navtitle changed, made (in topicmeta), or the attribute; locktitle for a topic; cleared', () => {
            assert.strictEqual(maps.setLabel(0, 'x')(EditorState.create({ doc: buildDocument(parse(MAP), mapEs).doc })), false, 'not a row');
            const label = (name: string, value: string, text: string) => {
                const { doc } = buildDocument(parse(MAP), mapEs);
                const pos = rowWith(doc, mapEs, name, value);
                return onRow(MAP, () => pos, maps.setLabel(pos, text)).out;
            };
            const install = label('href', 'topics/install.dita', 'Installing the kit');
            assert.ok(install.includes('<topicref href="topics/install.dita" locktitle="yes">\n      <topicmeta>\n        <navtitle>Installing the kit</navtitle>'), install);
            const first = label('href', 'topics/first.dita', 'First & foremost');
            assert.ok(first.includes(['<topicref href="topics/first.dita" locktitle="yes">', '        <topicmeta>', '          <navtitle>First &amp; foremost</navtitle>',
                '        </topicmeta>', '      </topicref>'].join('\n')), first);
            const head = label('navtitle', 'Getting started', 'Start here');
            assert.ok(head.includes('<topichead navtitle="Start here">'), head);
            const key = label('keys', 'product', 'Product name');
            assert.ok(key.includes('<keydef keys="product">\n    <topicmeta>\n      <navtitle>Product name</navtitle>\n      <keywords>'), key);
            const cleared = label('href', 'topics/install.dita', ' ');
            assert.ok(cleared.includes('<topicref href="topics/install.dita">\n      <topicref href="topics/first.dita"/>'), cleared);
        });
    });

    suite('relationship tables (M3)', () => {
        let cmds: DitaCommands;
        let rel: RelTableCommands;
        let maps: MapCommands;
        suiteSetup(() => {
            cmds = new DitaCommands(mapEs);
            rel = new RelTableCommands(mapEs, cmds);
            maps = new MapCommands(mapEs, cmds);
        });

        const REL = ['<map>', '  <title>Rel</title>', '  <topicref href="a.dita"/>', '  <reltable>', '    <relheader>', '      <relcolspec type="concept"/>',
            '      <relcolspec type="task"/>', '    </relheader>', '    <relrow>', '      <relcell>', '        <topicref href="a.dita"/>', '      </relcell>',
            '      <relcell/>', '    </relrow>', '  </reltable>', '</map>', ''].join('\n');

        /** The cell (`row`, `col`) of the first table of `doc` (row -1: the header). */
        const cell = (doc: PMNode, row: number, col: number): number => {
            let table = -1;
            doc.descendants((node, pos) => {
                if (table === -1 && node.type.name.startsWith('reltable')) {
                    table = pos;
                }
                return table === -1;
            });
            const grid = rel.gridAt(EditorState.create({ doc, selection: NodeSelection.create(doc, table) }))!;
            return rel.cellPos(grid, row, col)!;
        };
        const lines = (...l: string[]) => l.join('\n');

        test('a new relationship table: a header and a row of empty cells, its first cell selected', () => {
            const { out, state } = onRow(NEST_REL, (d) => rowWith(d, mapEs, 'href', 'a.dita'), rel.insertRelTable(2, 1));
            assert.ok(out.includes(lines('  <topicref href="a.dita"/>', '  <reltable>', '    <relheader>', '      <relcolspec/>', '      <relcolspec/>',
                '    </relheader>', '    <relrow>', '      <relcell/>', '      <relcell/>', '    </relrow>', '  </reltable>', '  <topicref href="b.dita">')), out);
            assert.strictEqual(rel.selectedCell(state)?.node.type.name, 'relcell');
            // Where the DTD does not take one (in a reference), at the end of the map.
            const nested = onRow(NEST_REL, (d) => rowWith(d, mapEs, 'href', 'c.dita'), rel.insertRelTable(1, 1)).out;
            assert.ok(nested.endsWith(lines('  </reltable>', '</map>', '')) && nested.indexOf('<reltable>') > nested.indexOf('d.dita'), nested);
        });

        test('a column: a header and a cell in every row; deleted with them; never the last one', () => {
            const added = onRow(REL, (d) => cell(d, 0, 0), rel.addColumn('after')).out;
            assert.ok(added.includes(lines('      <relcolspec type="concept"/>', '      <relcolspec/>', '      <relcolspec type="task"/>')), added);
            assert.ok(added.includes(lines('      </relcell>', '      <relcell/>', '      <relcell/>', '    </relrow>')), added);
            const deleted = onRow(REL, (d) => cell(d, 0, 1), rel.deleteColumn).out;
            assert.ok(!deleted.includes('type="task"') && deleted.includes(lines('      <relcolspec type="concept"/>', '    </relheader>')), deleted);
            assert.ok(deleted.includes(lines('      </relcell>', '    </relrow>')), deleted);
            const { doc } = buildDocument(parse(deleted), mapEs);
            assert.strictEqual(rel.deleteColumn(EditorState.create({ doc, selection: NodeSelection.create(doc, cell(doc, -1, 0)) })), false, 'the last column');
        });

        test('rows: above, below, from the header; moved; deleted, never the last one', () => {
            const below = onRow(REL, (d) => cell(d, 0, 1), rel.addRow('after')).out;
            assert.ok(below.includes(lines('    </relrow>', '    <relrow>', '      <relcell/>', '      <relcell/>', '    </relrow>', '  </reltable>')), below);
            const first = onRow(REL, (d) => cell(d, -1, 0), rel.addRow('after')).out;
            assert.ok(first.includes(lines('    </relheader>', '    <relrow>', '      <relcell/>', '      <relcell/>', '    </relrow>', '    <relrow>')), first);
            const { doc } = buildDocument(parse(REL), mapEs);
            const at = (row: number, col: number) => EditorState.create({ doc, selection: NodeSelection.create(doc, cell(doc, row, col)) });
            assert.strictEqual(rel.addRow('before')(at(-1, 0)), false, 'above the header');
            assert.strictEqual(rel.deleteRow(at(0, 0)), false, 'the last row');
            const moved = onRow(below, (d) => cell(d, 0, 0), rel.moveRow(1)).out;
            assert.ok(moved.indexOf('<relcell/>\n      <relcell/>\n    </relrow>\n    <relrow>\n      <relcell>') !== -1, moved);
            const gone = onRow(below, (d) => cell(d, 1, 0), rel.deleteRow).out;
            assert.strictEqual(gone, REL);
        });

        test('the keyboard between cells: reading order, up and down, Tab past the last cell adds a row', () => {
            const { doc } = buildDocument(parse(REL), mapEs);
            const go = (from: [number, number], dir: Parameters<RelTableCommands['goToCell']>[0], addRow = true): EditorState | false => {
                let state = EditorState.create({ doc, selection: NodeSelection.create(doc, cell(doc, from[0], from[1])) });
                return rel.goToCell(dir, addRow)(state, (tr) => {
                    state = state.apply(tr);
                }) && state;
            };
            const where = (state: EditorState | false) => (state ? state.selection.from : -1);
            assert.strictEqual(where(go([-1, 0], 'next')), cell(doc, -1, 1));
            assert.strictEqual(where(go([-1, 1], 'next')), cell(doc, 0, 0));
            assert.strictEqual(where(go([0, 0], 'previous')), cell(doc, -1, 1));
            assert.strictEqual(where(go([0, 1], 'up')), cell(doc, -1, 1));
            assert.strictEqual(go([0, 0], 'left'), false);
            assert.strictEqual(go([0, 1], 'next', false), false);
            const added = go([0, 1], 'next');
            assert.ok(added && added.doc.childCount === 1 && added.doc.firstChild!.lastChild!.childCount === 3, 'a new row');
            assert.strictEqual(added && rel.selectedCell(added)?.node.childCount, 0);
        });

        test('a reference goes into the selected cell; a row is dropped into a cell', () => {
            const into = onRow(REL, (d) => cell(d, 0, 1), maps.insertReference({ href: 'b.dita' })).out;
            assert.ok(into.includes(lines('      <relcell>', '        <topicref href="b.dita"/>', '      </relcell>', '    </relrow>')), into);
            const { doc } = buildDocument(parse(REL), mapEs);
            const from = rowWith(doc, mapEs, 'href', 'a.dita');
            const to = maps.dropPosition(doc, from, cell(doc, 0, 1), 'inside');
            assert.ok(to !== undefined);
            const dropped = onRow(REL, () => from, maps.moveRow(from, to!)).out;
            assert.ok(dropped.includes(lines('  <title>Rel</title>', '  <reltable>')), dropped);
            assert.ok(dropped.includes(lines('      <relcell>', '        <topicref href="a.dita"/>', '      </relcell>', '    </relrow>')), dropped);
            assert.strictEqual(maps.dropPosition(doc, from, cell(doc, 0, 1), 'before'), undefined, 'not beside a cell');
        });

        test('a column header shows its type; an empty cell says so; the menu keeps the grid', () => {
            const { doc } = buildDocument(parse(REL), mapEs);
            const header = doc.nodeAt(cell(doc, -1, 0))!;
            const spec = JSON.stringify(header.type.spec.toDOM!(header));
            assert.ok(spec.includes('"dc-colspec-type","contenteditable":"false"},"concept"'), spec);
            const empty = doc.nodeAt(cell(doc, 0, 1))!;
            assert.ok(JSON.stringify(empty.type.spec.toDOM!(empty)).includes('"data-placeholder":"no references"'));
            const state = EditorState.create({ doc, selection: NodeSelection.create(doc, cell(doc, 0, 1)) });
            const ctx: MenuContext = {
                es: mapEs, cmds, tables: new TableCommands(mapEs), images: new ImageCommands(mapEs, cmds), links: new LinkCommands(mapEs, cmds),
                editable: true, reuse: false, maps, relTables: rel,
            };
            const menu = contextMenu(state, ctx);
            assert.ok(findItem(menu, 'reltable/columnRight')?.enabled && findItem(menu, 'reltable/rowBelow')?.enabled);
            assert.strictEqual(findItem(menu, 'reltable/deleteRow')?.enabled, false, 'the only row');
            assert.strictEqual(findItem(menu, 'element/delete'), undefined, 'a cell is not deleted alone');
            assert.strictEqual(findItem(menu, 'insert/relcell'), undefined, 'nor inserted alone');
            assert.ok(findItem(menu, 'map/reference')?.enabled, 'a reference into the cell');
        });

        test('random table and row commands keep a grid and read back as edited', () => {
            let seed = Number(process.env.DITACRAFT_FUZZ_SEED) || 5;
            const rnd = (n: number): number => {
                seed = (seed * 1103515245 + 12345) & 0x7fffffff;
                return Math.floor(seed / 65536) % n; // the high bits: the low ones repeat
            };
            const failures: string[] = [];
            let applied = 0;
            const { doc, base } = buildDocument(parse(REL), mapEs);
            for (let run = 0; run < 30; run++) {
                let state = EditorState.create({ doc });
                for (let step = 0; step < 10; step++) {
                    // A cell, or now and then a row.
                    const cells: number[] = [];
                    state.doc.descendants((node, pos) => {
                        if (rel.isCell(node)) {
                            cells.push(pos);
                        }
                        return true;
                    });
                    const rows = mapRows(state.doc, mapEs);
                    const pick = rnd(4) === 0 && rows.length > 0 ? rows[rnd(rows.length)].pos : cells[rnd(cells.length)];
                    state = state.apply(state.tr.setSelection(NodeSelection.create(state.doc, pick)));
                    const commands: [string, Command][] = [
                        ['row before', rel.addRow('before')], ['row after', rel.addRow('after')], ['delete row', rel.deleteRow],
                        ['up', rel.moveRow(-1)], ['down', rel.moveRow(1)], ['column before', rel.addColumn('before')], ['column after', rel.addColumn('after')],
                        ['delete column', rel.deleteColumn], ['next', rel.goToCell('next')], ['reference', maps.insertReference({ href: `t${step}.dita` })],
                        ['indent', maps.indentRow], ['outdent', maps.outdentRow], ['table', rel.insertRelTable(2, 2)],
                    ];
                    const [name, command] = commands[rnd(commands.length)];
                    if (!command(state, (tr) => {
                        state = state.apply(tr);
                    })) {
                        continue;
                    }
                    applied++;
                    // Every table stays a grid: as many cells in each row as columns in its header.
                    state.doc.descendants((node) => {
                        if (node.type.name.startsWith('reltable')) {
                            const widths = new Set<number>();
                            node.forEach((child) => widths.add(child.childCount));
                            if (widths.size > 1) {
                                failures.push(`${name}: rows of ${[...widths].join('/')} cells`);
                            }
                            return false;
                        }
                        return true;
                    });
                    const reloaded = buildDocument(parse(serializeDocument(state.doc, base)), mapEs).doc;
                    if (readingSignature(reloaded, mapEs) !== readingSignature(state.doc, mapEs)) {
                        failures.push(`${name} reads back differently`);
                    }
                }
            }
            assert.ok(applied > 150, `only ${applied} commands applied`);
            assert.deepStrictEqual(failures.slice(0, 10), []);
        });
    });
});
