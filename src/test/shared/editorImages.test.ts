/**
 * Visual Editor images Test Suite.
 *
 * Where an image can go (in the text, on its own line, in a figure — by the DTD), the source
 * each insertion writes, alternative text and file replacement on an existing image, how an
 * image shows on the page, and the host's file helpers (hrefs, pasted image names, dropped URIs).
 */

import * as assert from 'assert';
import * as os from 'os';
import * as path from 'path';
import type { DOMOutputSpec, Node as PMNode } from 'prosemirror-model';
import { type Command, EditorState, NodeSelection, TextSelection } from 'prosemirror-state';
import { parse } from '../../shared/cst/parse';
import { DitaCommands } from '../../shared/editor/commands';
import { droppedUris, ImageCommands, isImagePath, resizedImageSize, withAltText } from '../../shared/editor/images';
import { buildEditorSchema, type EditorSchema } from '../../shared/editor/schema';
import { buildDocument, type Base } from '../../shared/editor/toProseMirror';
import { serializeDocument } from '../../shared/editor/toSource';
import { extensionForMime, hrefFor, pastedImageFolder, pastedImageName } from '../../editor/imageFiles';
import { readingSignature } from './editorHelpers';
import { ditabaseGrammar } from './helpers';

let es: EditorSchema;
let cmds: DitaCommands;
let images: ImageCommands;

const wrap = (body: string) => `<topic id="t">\n  <title>The title</title>\n  <body>\n${body}\n  </body>\n</topic>`;

function textPos(doc: PMNode, text: string): number {
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

function imagePos(doc: PMNode): number {
    let found = -1;
    doc.descendants((node, pos) => {
        if (found === -1 && es.role(node.type)?.element === 'image') {
            found = pos;
        }
        return found === -1;
    });
    assert.notStrictEqual(found, -1, 'no image');
    return found;
}

interface Run {
    state: EditorState;
    base: Base;
}

/** The document of `source` with the cursor after `after` (or in the first empty paragraph, or on the image). */
function at(source: string, where: { after?: string; empty?: boolean; image?: boolean }): Run {
    const { doc, base } = buildDocument(parse(source), es);
    let selection;
    if (where.image) {
        selection = NodeSelection.create(doc, imagePos(doc));
    } else if (where.empty) {
        let pos = -1;
        doc.descendants((node, p) => {
            if (pos === -1 && node.isTextblock && node.content.size === 0) {
                pos = p + 1;
            }
            return pos === -1;
        });
        selection = TextSelection.create(doc, pos);
    } else {
        selection = TextSelection.create(doc, textPos(doc, where.after!) + where.after!.length);
    }
    return { state: EditorState.create({ doc, selection }), base };
}

function apply(run: Run, command: Command): Run & { out: string } {
    let state = run.state;
    assert.ok(command(state, (tr) => {
        state = state.apply(tr);
    }), 'the command applies');
    const fix = cmds.normalize(state);
    if (fix) {
        state = state.apply(fix);
    }
    const out = serializeDocument(state.doc, run.base);
    assert.strictEqual(readingSignature(buildDocument(parse(out), es).doc, es), readingSignature(state.doc, es), 'reads back as edited');
    return { state, base: run.base, out };
}

suite('Visual Editor: images', function () {
    this.timeout(60000);

    suiteSetup(() => {
        es = buildEditorSchema(ditabaseGrammar());
        cmds = new DitaCommands(es);
        images = new ImageCommands(es, cmds);
    });

    suite('where an image can go', () => {
        test('in a paragraph: in the text, on its own line, in a figure; in a title: no figure', () => {
            const source = wrap('    <p>See the pump here.</p>');
            assert.deepStrictEqual(images.placements(at(source, { after: 'pump ' }).state), ['inline', 'break', 'figure']);
            assert.deepStrictEqual(images.placements(at(source, { after: 'The ' }).state), ['inline', 'break']);
        });

        test('the grammar has an <alt> element', () => {
            assert.ok(images.hasAltElement);
        });
    });

    suite('inserting', () => {
        test('in the text, with its alternative text', () => {
            const { out, state } = apply(at(wrap('    <p>See the pump here.</p>'), { after: 'pump ' }), images.insert('inline', { href: 'img/pump.png', alt: 'The pump & valve' }));
            assert.ok(out.includes('<p>See the pump <image href="img/pump.png"><alt>The pump &amp; valve</alt></image>here.</p>'), out);
            assert.strictEqual(state.doc.textBetween(state.selection.from, state.selection.from + 4), 'here', 'the cursor follows the image');
        });

        test('on its own line: instead of an empty paragraph', () => {
            const { out } = apply(at(wrap('    <p>Text.</p>\n    <p></p>'), { empty: true }), images.insert('break', { href: 'a.png' }));
            assert.strictEqual(out, wrap('    <p>Text.</p>\n    <image href="a.png" placement="break"/>'));
        });

        test('on its own line: in the paragraph at the cursor', () => {
            const { out } = apply(at(wrap('    <p>Before after.</p>'), { after: 'Before ' }), images.insert('break', { href: 'a.png' }));
            assert.ok(out.includes('<p>Before <image href="a.png" placement="break"/>after.</p>'), out);
        });

        test('in a figure after the current block, the cursor in its title', () => {
            const run = apply(at(wrap('    <p>Text.</p>'), { after: 'Text' }), images.insert('figure', { href: 'a b.png', alt: 'Diagram' }));
            assert.ok(run.out.includes('<p>Text.</p>\n    <fig>\n      <title/>\n      <image href="a b.png" placement="break"><alt>Diagram</alt></image>\n    </fig>'), run.out);
            const typed = run.state.apply(run.state.tr.insertText('Pump'));
            assert.ok(serializeDocument(typed.doc, run.base).includes('<title>Pump</title>'));
        });

        test('not where the DTD does not allow it', () => {
            const run = at('<topic id="t"><title>T</title><body><ul><li>Item</li></ul></body></topic>', { after: 'Item' });
            assert.ok(images.insert('inline', { href: 'a.png' })(run.state), 'an item takes an image');
            const sl = at('<topic id="t"><title>T</title><body><p>x</p><dl><dlentry><dt>Term</dt><dd>D</dd></dlentry></dl></body></topic>', { after: 'Term' });
            assert.strictEqual(images.insert('inline', { href: 'a.png' })(sl.state), es.allows('dt', 'image'));
        });

        test('a new image follows attribute changes made later (Properties)', () => {
            const run = apply(at(wrap('    <p>See here.</p>'), { after: 'See ' }), images.insert('inline', { href: 'a.png', alt: 'A' }));
            const pos = imagePos(run.state.doc);
            const node = run.state.doc.nodeAt(pos)!;
            const next = run.state.apply(run.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, xml: [['href', 'a.png'], ['width', '200']] }));
            assert.ok(serializeDocument(next.doc, run.base).includes('<image href="a.png" width="200"><alt>A</alt></image>'));
        });
    });

    suite('an image in the document', () => {
        test('alternative text: added, replaced as written, removed', () => {
            const added = apply(at(wrap('    <p>See <image href="a.png"/> here.</p>'), { image: true }), images.setAlt('A pump', '<image href="a.png"/>'));
            assert.ok(added.out.includes('<p>See <image href="a.png"><alt>A pump</alt></image> here.</p>'), added.out);
            const source = wrap('    <image href="a.png" placement="break">\n      <alt>Old</alt>\n    </image>');
            const raw = '<image href="a.png" placement="break">\n      <alt>Old</alt>\n    </image>';
            const replaced = apply(at(source, { image: true }), images.setAlt('New <text>', raw));
            assert.ok(replaced.out.includes('<image href="a.png" placement="break">\n      <alt>New &lt;text&gt;</alt>\n    </image>'), replaced.out);
            const removed = apply(at(source, { image: true }), images.setAlt('', raw));
            assert.ok(removed.out.includes('<image href="a.png" placement="break">\n      \n    </image>'), removed.out);
        });

        test('another file: href set in place, a key reference gives way', () => {
            const { out } = apply(at(wrap('    <p>See <image keyref="logo" width="20"/> here.</p>'), { image: true }), images.setHref('img/new.png'));
            assert.ok(out.includes('<image width="20" href="img/new.png"/>'), out);
        });

        test('resizing: width and height scale together in their own units; @scale goes', () => {
            const shown = { width: 200, height: 100 };
            assert.deepStrictEqual(resizedImageSize({ width: '200' }, shown, 300), { width: '300' });
            assert.deepStrictEqual(resizedImageSize({ width: '200px', height: '100px' }, shown, 100), { width: '100px', height: '50px' });
            assert.deepStrictEqual(resizedImageSize({ width: '2in' }, { width: 192, height: 96 }, 288), { width: '3in' });
            assert.deepStrictEqual(resizedImageSize({ width: '2in' }, shown, 300), { width: '3in' }, 'by how much the shown width changed');
            assert.deepStrictEqual(resizedImageSize({ height: '75pt' }, shown, 300), { height: '112.5pt' });
            assert.deepStrictEqual(resizedImageSize({}, shown, 250.4), { width: '250' }, 'no size given: the width, in pixels');
            assert.deepStrictEqual(resizedImageSize({ scale: '50' }, shown, 150), { width: '150', scale: null });
        });

        test('resizing writes the size attributes in place', () => {
            const source = wrap('    <image href="a.png" placement="break"\n           width="300" scale="80"><alt>A</alt></image>');
            const { out } = apply(at(source, { image: true }), images.setSize({ width: '420', scale: null }));
            assert.strictEqual(out, source.replace('width="300" scale="80"', 'width="420"'));
            const added = apply(at(wrap('    <p>See <image href="a.png"/> here.</p>'), { image: true }), images.setSize({ width: '64' }));
            assert.ok(added.out.includes('<image href="a.png" width="64"/>'), added.out);
        });

        test('withAltText on the source forms', () => {
            const isAlt = (n: string) => n === 'alt';
            assert.strictEqual(withAltText('<image href="a"/>', 'x', isAlt), '<image href="a"><alt>x</alt></image>');
            assert.strictEqual(withAltText('<image href="a"><alt/></image>', 'x', isAlt), '<image href="a"><alt>x</alt></image>');
            assert.strictEqual(withAltText('<image href="a"><longdescref href="d"/></image>', 'x', isAlt), '<image href="a"><alt>x</alt><longdescref href="d"/></image>');
            assert.strictEqual(withAltText('<image href="a"/>', '', isAlt), '<image href="a"/>');
        });

        test('shown as the preview shows it: size, own line, alignment, alt text', () => {
            const { doc } = buildDocument(parse(wrap('    <p>See <image href="a.png" width="120" height="3cm" placement="break" align="center"><alt>Pump</alt></image></p>')), es);
            const node = doc.nodeAt(imagePos(doc))!;
            const spec = node.type.spec.toDOM!(node) as unknown as [string, Record<string, string>, [string, Record<string, string>]];
            assert.strictEqual(spec[0], 'span');
            assert.strictEqual(spec[1].class, 'image-break imagecenter');
            const img = spec[2];
            assert.strictEqual(img[0], 'img');
            assert.strictEqual(img[1].alt, 'Pump');
            assert.strictEqual(img[1].style, 'width:120px;height:3cm');
            const keyed = buildDocument(parse(wrap('    <p>See <image keyref="logo"/></p>')), es).doc;
            const missing = keyed.nodeAt(imagePos(keyed))!.type.spec.toDOM!(keyed.nodeAt(imagePos(keyed))!) as DOMOutputSpec;
            assert.ok(JSON.stringify(missing).includes('[logo]'), JSON.stringify(missing));
        });
    });

    suite('files (host helpers)', () => {
        const root = path.join(os.tmpdir(), 'ditacraft-images');
        const doc = path.join(root, 'topics', 'pump.dita');

        test('hrefs are relative URI references', () => {
            assert.strictEqual(hrefFor(doc, path.join(root, 'topics', 'a.png')), 'a.png');
            assert.strictEqual(hrefFor(doc, path.join(root, 'topics', 'img', 'pic one#2.png')), 'img/pic%20one%232.png');
            assert.strictEqual(hrefFor(doc, path.join(root, 'shared', 'é.png')), '../shared/é.png');
            if (process.platform === 'win32' && !/^z:/i.test(root)) {
                assert.ok(hrefFor(doc, 'Z:\\pics\\a.png').startsWith('file:///Z:/pics/a.png'));
            }
        });

        test('pasted images: the folder, a name after the topic, an extension for the media type', () => {
            assert.strictEqual(pastedImageFolder('images', doc, root), path.join(root, 'topics', 'images'));
            assert.strictEqual(pastedImageFolder('${workspaceFolder}/assets', doc, root), path.join(root, 'assets'));
            const taken = new Set(['pump-1.png', 'pump-2.png']);
            assert.strictEqual(pastedImageName(doc, 'png', (n) => taken.has(n)), 'pump-3.png');
            assert.strictEqual(pastedImageName(path.join(root, 'my topic.dita'), 'jpg', () => false), 'my-topic-1.jpg');
            assert.deepStrictEqual(['image/png', 'image/jpeg', 'image/svg+xml', 'image/x-unknown'].map(extensionForMime), ['png', 'jpg', 'svg', 'png']);
        });

        test('dropped files: URI lists of browsers and of VS Code; images by extension', () => {
            const data: Record<string, string> = {
                'text/uri-list': '# comment\r\nfile:///c%3A/a/b.png\r\nfile:///c%3A/a/c.txt',
                'application/vnd.code.uri-list': JSON.stringify(['file:///c%3A/a/b.png', 'file:///c%3A/a/d.JPG']),
            };
            const uris = droppedUris((t) => data[t] ?? '');
            assert.deepStrictEqual(uris, ['file:///c%3A/a/b.png', 'file:///c%3A/a/d.JPG', 'file:///c%3A/a/c.txt']);
            assert.deepStrictEqual(uris.filter(isImagePath), ['file:///c%3A/a/b.png', 'file:///c%3A/a/d.JPG']);
        });
    });
});
