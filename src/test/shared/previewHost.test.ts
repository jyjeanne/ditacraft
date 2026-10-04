/**
 * Visual Preview host-module Test Suite (spec §4.5, §7, §11).
 *
 * Grammar selection, reference resolution, DITAVAL evaluation and problem mapping — the
 * host logic that has no `vscode` dependency, tested with in-memory files and keys.
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { ElementIndex } from '../../shared/cst/elementIndex';
import { parse } from '../../shared/cst/parse';
import { findElements } from '../../shared/cst/query';
import type { ElementNode } from '../../shared/cst/types';
import { buildBundledGrammars } from '../../shared/grammar/buildGrammars';
import { needsFullRender, renderDocument } from '../../shared/render/toHtml';
import { conditionMarks, flagKey, flagLook, type MarkSpan } from '../../preview/conditionMarks';
import { buildDitavalFilter } from '../../preview/ditaval';
import { GrammarRegistry, versionFor } from '../../preview/grammarRegistry';
import { mapProblems } from '../../preview/problems';
import { parseReference, ReferenceResolver, resolvePath, selectLines, type KeyDefinitionLike } from '../../preview/resolver';
import { DTDS_DIR, REPO_ROOT } from './helpers';

const ROOT = path.resolve(os.tmpdir(), 'ditacraft-preview-fixture');
const p = (...parts: string[]) => path.join(ROOT, ...parts);

function resolverFor(files: Record<string, string>, keys: Record<string, KeyDefinitionLike> = {}): ReferenceResolver {
    return new ReferenceResolver({
        files: { readText: async (file) => files[path.resolve(file)] ?? null },
        keys: { resolveKey: async (name) => keys[name] ?? null },
    });
}

suite('Visual Preview: host modules', function () {
    this.timeout(120000);

    suite('reference resolution (spec §7)', () => {
        const lib = '<topic id="lib"><title>Library</title><body>'
            + '<note id="n">Use <ph keyref="product"/></note><p id="p1">one</p><p id="p2">two</p>'
            + '<section id="sec"><title>Setup section</title></section></body></topic>';
        const files: Record<string, string> = {
            [p('lib.dita')]: lib,
            [p('other.dita')]: '<concept id="o"><title>Other topic</title></concept>',
            [p('code.txt')]: 'line1\nline2\nline3\nline4',
            [p('eq.mml')]: '<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>x</mi></math>',
            [p('gloss.dita')]: '<glossentry id="g"><glossterm>Application Programming Interface</glossterm><glossBody><glossAlt><glossAcronym>API</glossAcronym></glossAlt></glossBody></glossentry>',
            [p('a.dita')]: '<topic id="a"><title>A</title><body><p id="x" conref="b.dita#b/y"/></body></topic>',
            [p('b.dita')]: '<topic id="b"><title>B</title><body><p id="y" conref="a.dita#a/x"/></body></topic>',
        };
        const keys: Record<string, KeyDefinitionLike> = {
            product: { keyName: 'product', inlineContent: 'AquaFlow 300' },
            libkey: { keyName: 'libkey', targetFile: p('lib.dita'), elementId: 'lib' },
            pump: { keyName: 'pump', targetFile: p('images', 'pump.svg') },
            api: { keyName: 'api', targetFile: p('gloss.dita') },
            othertopic: { keyName: 'othertopic', targetFile: p('other.dita'), metadata: { navtitle: 'Other (nav)' } },
        };
        const topic = '<topic id="t"><title>T</title><body>'
            + '<note conref="lib.dita#lib/n"/>'
            + '<p conkeyref="libkey/p1"/>'
            + '<p conref="lib.dita#lib/p1" conrefend="lib.dita#lib/p2"/>'
            + '<p><ph keyref="product"/> <ph keyref="missing"/> <xref href="other.dita"/> <xref href="lib.dita#lib/sec"/> <xref keyref="othertopic"/>'
            + ' <abbreviated-form keyref="api"/> then <abbreviated-form keyref="api"/></p>'
            + '<image keyref="pump"/>'
            + '<codeblock><coderef href="code.txt#line-range(2,3)"/></codeblock>'
            + '<p><mathml><mathmlref href="eq.mml"/></mathml></p>'
            + '<p conref="a.dita#a/x"/>'
            + '<p conref="nowhere.dita#z/q"/>'
            + '</body></topic>';
        let resolutions: Map<ElementNode, import('../../shared/render/types').Resolution>;
        let dependencies: Set<string>;
        let doc: ReturnType<typeof parse>;

        suiteSetup(async () => {
            doc = parse(topic);
            const outcome = await resolverFor(files, keys).resolve(doc, p('topic.dita'));
            resolutions = outcome.resolutions;
            dependencies = outcome.dependencies;
        });

        const at = (name: string, i: number) => resolutions.get(findElements(doc, name)[i]);

        test('conref, conkeyref and conrefend ranges', () => {
            const note = at('note', 0)!;
            assert.strictEqual(note.kind, 'conref');
            assert.strictEqual(note.from, 'lib.dita#lib/n');
            assert.strictEqual(note.conrefTarget?.name, 'note');
            assert.ok(note.sourceDoc && note.sourcePath === p('lib.dita'));
            assert.strictEqual(at('p', 0)?.conrefTarget?.attrs.find((a) => a.name === 'id')?.value, 'p1', 'conkeyref resolved through the key');
            assert.deepStrictEqual(at('p', 1)?.conrefRange?.map((e) => e.attrs.find((a) => a.name === 'id')?.value), ['p1', 'p2']);
        });

        test('references inside reused content resolve too', () => {
            const libPh = [...resolutions.keys()].find((el) => el.name === 'ph' && el.attrs.some((a) => a.value === 'product') && !findElements(doc, 'ph').includes(el));
            assert.ok(libPh, 'the keyref inside lib.dita\'s note has its own resolution');
            assert.strictEqual(resolutions.get(libPh!)?.text, 'AquaFlow 300');
        });

        test('keyref text, missing keys, xref titles and navtitles', () => {
            assert.strictEqual(at('ph', 0)?.text, 'AquaFlow 300');
            assert.match(at('ph', 1)?.unresolved ?? '', /key "missing" is not defined/);
            assert.strictEqual(at('xref', 0)?.text, 'Other topic');
            assert.strictEqual(at('xref', 1)?.text, 'Setup section');
            assert.strictEqual(at('xref', 2)?.text, 'Other (nav)');
            assert.strictEqual(at('xref', 2)?.path, p('other.dita'));
        });

        test('glossary abbreviated-form: surface form on first use, acronym afterwards', () => {
            assert.strictEqual(at('abbreviated-form', 0)?.text, 'Application Programming Interface (API)');
            assert.strictEqual(at('abbreviated-form', 1)?.text, 'API');
        });

        test('image keyref, coderef line range and mathmlref', () => {
            assert.strictEqual(at('image', 0)?.path, p('images', 'pump.svg'));
            assert.strictEqual(at('coderef', 0)?.text, 'line2\nline3');
            assert.strictEqual(at('mathmlref', 0)?.foreignRoot?.name, 'math');
        });

        test('circular and missing reuse are reported, not followed', () => {
            assert.match(at('p', 4)?.unresolved ?? '', /circular reuse/);
            assert.match(at('p', 5)?.unresolved ?? '', /cannot read nowhere\.dita/);
        });

        test('every file read is a dependency', () => {
            for (const file of ['lib.dita', 'other.dita', 'code.txt', 'eq.mml', 'gloss.dita', 'a.dita', 'b.dita']) {
                assert.ok(dependencies.has(p(file)), file);
            }
        });

        test('resolutions render: reused note, key text, glossary, code, MathML', () => {
            const html = renderDocument(doc, { resolutions }).html;
            assert.ok(html.includes('Use <span class="ph"'), html);
            assert.ok(html.includes('>AquaFlow 300</span>'), html);
            assert.ok(html.includes('>Application Programming Interface (API)</span>'), html);
            assert.ok(html.includes('line2\nline3'), html);
            assert.ok(html.includes('<math><mi>x</mi></math>'), html);
        });

        test('helpers: parseReference and selectLines', () => {
            assert.deepStrictEqual(parseReference('f.dita#t/e'), { file: 'f.dita', fragment: 't/e', topicId: 't', elemId: 'e' });
            assert.deepStrictEqual(parseReference('#t'), { file: '', fragment: 't', topicId: 't', elemId: undefined });
            assert.strictEqual(selectLines('a\nb\nc', 'line-range(2)'), 'b\nc');
            assert.strictEqual(selectLines('a\nb', undefined), 'a\nb');
        });

        test('resolvePath: relative references, encoded names and file URLs', () => {
            assert.strictEqual(resolvePath(p('dir', 'topic.dita'), '../lib%20one.dita'), p('lib one.dita'));
            const absolute = p('abs.dita');
            assert.strictEqual(resolvePath(p('topic.dita'), pathToFileURL(absolute).href), absolute);
            if (process.platform === 'win32') {
                assert.strictEqual(resolvePath(p('topic.dita'), 'file://server/share/x.dita'), '\\\\server\\share\\x.dita');
            }
        });

        test('a Windows drive path is a file reference, not a URL', async () => {
            const target = p('other.dita');
            const doc = parse(`<topic id="t"><title>T</title><body><p><xref href="${target}"/></p></body></topic>`);
            const { resolutions } = await resolverFor(files).resolve(doc, p('topic.dita'));
            assert.strictEqual(resolutions.get(findElements(doc, 'xref')[0])?.text, 'Other topic');
        });
    });

    suite('reused structures (review regressions)', () => {
        const files: Record<string, string> = {
            [p('parts.dita')]: '<topic id="parts"><title>Parts</title><body>'
                + '<table id="tbl" frame="all"><title>Specs</title><tgroup cols="2"><tbody><row><entry>Flow</entry><entry>3 m3/h</entry></row></tbody></tgroup></table>'
                + '<fig id="f"><title>Pump view</title><image href="img/pump.png"/></fig>'
                + '<image id="logo" href="img/logo.png"/>'
                + '<p id="x">Loop <ph conref="#parts/x"/></p>'
                + '</body></topic>',
        };
        const topic = '<topic id="t"><title>T</title><body>'
            + '<table conref="parts.dita#parts/tbl"/><fig conref="parts.dita#parts/f"/><p><image conref="parts.dita#parts/logo"/></p>'
            + '<p id="self">Self <ph conref="#t/self"/></p>'
            + '</body></topic>';

        test('reused tables, figures and images keep their structure and attributes', async () => {
            const doc = parse(topic);
            const { resolutions } = await resolverFor(files).resolve(doc, p('topic.dita'));
            const seen: { href: string; source?: string }[] = [];
            const html = renderDocument(doc, {
                resolutions,
                imageSrc: (href, _el, source) => {
                    seen.push({ href, source });
                    return `img:${href}`;
                },
            }).html.replace(/ data-(?:dita|class|struct-id)="[^"]*"/g, '');
            assert.ok(html.includes('<table class="table frame-all dc-conref"'), html);
            assert.ok(html.includes('<span class="title">Specs</span>'), html);
            assert.ok(html.includes('>3 m3/h</td>'), html);
            assert.ok(html.includes('<span class="fig--title">Pump view</span>'), html);
            assert.ok(seen.some((s) => s.href === 'img/logo.png' && s.source === p('parts.dita')), JSON.stringify(seen));
            assert.ok(!seen.some((s) => s.href.endsWith('parts.dita')), 'a reused image must not load the .dita file');
        });

        test('reused content carries the referencing element\'s id only; footnotes inside it force a full render', async () => {
            const withFn = { ...files, [p('notes.dita')]: '<topic id="n"><title>N</title><body><p id="fp">See<fn>reused note</fn></p></body></topic>' };
            const doc = parse('<topic id="t"><title>T</title><body><table conref="parts.dita#parts/tbl"/><p conref="notes.dita#n/fp"/></body></topic>');
            const index = new ElementIndex(doc);
            const { resolutions } = await resolverFor(withFn).resolve(doc, p('topic.dita'));
            const html = renderDocument(doc, { resolutions, index }).html;
            const table = findElements(doc, 'table')[0];
            assert.ok(html.includes(`<table class="table frame-all dc-conref" data-dita="table" data-struct-id="${index.idOf(table)}"`), html);
            // Only the document's own elements answer for ids: t, title, body, table, p.
            assert.strictEqual([...html.matchAll(/data-struct-id="/g)].length, 5, html);
            assert.ok(html.includes('<sup class="fnnum">1</sup> reused note'), html);
            assert.strictEqual(needsFullRender(findElements(doc, 'p')[0], { resolutions }), true);
            assert.strictEqual(needsFullRender(table, { resolutions }), false);
        });

        test('a conref to its own ancestor is circular, and rendering terminates', async () => {
            const doc = parse(topic);
            const { resolutions } = await resolverFor(files).resolve(doc, p('topic.dita'));
            const selfPh = findElements(doc, 'ph')[0];
            assert.match(resolutions.get(selfPh)?.unresolved ?? '', /circular/);
            // The reused paragraph in parts.dita reuses itself too: rendering must not recurse forever.
            const html = renderDocument(doc, { resolutions }).html;
            assert.ok(html.includes('Self'), html);
        });
    });

    suite('DITAVAL (spec §11.3)', () => {
        const ditaval = '<val>'
            + '<prop action="exclude" att="audience" val="internal"/>'
            + '<prop action="flag" att="platform" val="windows" color="blue" backcolor="#eef" style="bold">'
            + '<startflag><alt-text>[Win]</alt-text></startflag></prop>'
            + '<revprop action="flag" val="2.0" color="green"/>'
            + '</val>';
        const filter = buildDitavalFilter(ditaval, p('filters', 'web.ditaval'));
        const doc = parse('<topic><p audience="internal">a</p><p platform="windows linux">b</p><p rev="2.0">c</p><p>d</p></topic>');
        const ps = findElements(doc, 'p');

        test('exclusions, attribute flags and revision flags', () => {
            assert.strictEqual(filter.label, 'web.ditaval');
            assert.deepStrictEqual(filter.evaluate(ps[0]), { excluded: true, flags: [] });
            assert.deepStrictEqual(filter.evaluate(ps[1])?.flags, [{ color: 'blue', backcolor: '#eef', style: 'bold', startText: '[Win]', startImage: undefined }]);
            assert.strictEqual(filter.evaluate(ps[2])?.flags[0].color, 'green');
            assert.strictEqual(filter.evaluate(ps[3]), undefined);
        });

        test('flags by the rule that governs each value: its own, its attribute\'s default, the filter-wide default', () => {
            const flagging = buildDitavalFilter('<val>'
                + '<prop action="flag" color="red"><startflag><alt-text>[!]</alt-text></startflag></prop>'
                + '<prop action="include" att="audience" val="user"/>'
                + '<prop action="flag" att="platform" color="green"/>'
                + '<prop action="include" att="platform" val="windows"/>'
                + '<revprop action="flag" color="blue"/>'
                + '</val>', p('filters', 'flags.ditaval'));
            const d = parse('<topic domains="a(props jobrole)"><p audience="admin">a</p><p audience="user">b</p><p platform="linux">c</p>'
                + '<p platform="windows">d</p><p rev="2">e</p><p audience="admin expert" product="kit">f</p><p jobrole="x">g</p><p outputclass="x">h</p></topic>');
            const [admin, user, linux, windows, rev, many, jobrole, other] = findElements(d, 'p');
            const colors = (el: typeof admin) => flagging.evaluate(el)?.flags.map((f) => f.color);
            assert.deepStrictEqual(colors(admin), ['red'], 'the filter-wide flag');
            assert.strictEqual(flagging.evaluate(admin)?.flags[0].startText, '[!]');
            assert.strictEqual(flagging.evaluate(user), undefined, 'its own include rule: no flag');
            assert.deepStrictEqual(colors(linux), ['green'], 'the attribute\'s default flag');
            assert.strictEqual(flagging.evaluate(windows), undefined, 'its own include rule wins over the attribute\'s default flag');
            assert.deepStrictEqual(colors(rev), ['blue'], '@rev by <revprop>, not the filter-wide flag');
            assert.deepStrictEqual(colors(many), ['red'], 'one flag for the same rule');
            assert.deepStrictEqual(colors(jobrole), ['red'], 'a declared @props specialization');
            assert.strictEqual(flagging.evaluate(other), undefined, 'not a filtering attribute');
            assert.strictEqual(flagging.evaluate(admin)?.excluded, false);
            // The first filter-wide rule decides: here an exclusion, so no flag.
            const first = buildDitavalFilter('<val><prop action="exclude"/><prop action="flag" color="red"/></val>', p('filters', 'first.ditaval'));
            assert.deepStrictEqual(first.evaluate(admin), { excluded: true, flags: [] });
        });

        test('a filter-wide default: every filtering attribute counts, with the @props specializations the document declares', () => {
            const wide = buildDitavalFilter('<val><prop action="exclude"/><prop action="include" att="audience" val="user"/></val>', p('filters', 'wide.ditaval'));
            const d = parse('<topic domains="a(props jobrole) (topic hi-d)"><p audience="user">a</p><p product="kit">b</p><p jobrole="admin">c</p>'
                + '<p rev="2" outputclass="x">d</p><p audience="">e</p></topic>');
            const [user, product, jobrole, rev, empty] = findElements(d, 'p');
            assert.strictEqual(wide.evaluate(user), undefined, 'included by its own rule');
            assert.strictEqual(wide.evaluate(product)?.excluded, true);
            assert.strictEqual(wide.evaluate(jobrole)?.excluded, true, 'a declared @props specialization');
            assert.strictEqual(wide.evaluate(rev), undefined, 'not filtering attributes');
            assert.strictEqual(wide.evaluate(empty)?.excluded ?? false, false, 'no values');
            // DITA 2.0 declares them in @specializations; undeclared, an attribute is not a filtering one.
            const d2 = parse('<topic specializations="@props/jobrole"><p jobrole="admin">a</p></topic><!-- -->');
            assert.strictEqual(wide.evaluate(findElements(d2, 'p')[0])?.excluded, true);
            const d3 = parse('<topic><p jobrole="admin">a</p></topic>');
            assert.strictEqual(wide.evaluate(findElements(d3, 'p')[0]), undefined);
            // A topic's metadata from its map.
            assert.strictEqual(wide.excludes({ audience: 'admin' }), true);
            assert.strictEqual(wide.excludes({ audience: 'user' }), false);
        });

        test('condition highlighting: the preview\'s decisions on the source, flags by look', () => {
            const filter = buildDitavalFilter('<val>'
                + '<prop action="flag" color="red" style="underline"><startflag><alt-text>[!]</alt-text></startflag></prop>'
                + '<prop action="include" att="audience" val="user"/>'
                + '<prop action="exclude" att="platform" val="mac"/>'
                + '<prop action="flag" att="product" val="kit" color="red" style="underline"><startflag><alt-text>[!]</alt-text></startflag></prop>'
                + '<revprop action="flag" val="2" backcolor="yellow"/>'
                + '</val>', p('filters', 'marks.ditaval'));
            const text = '<topic><p audience="admin">a</p><p audience="user">b</p>'
                + '<section platform="mac"><p audience="admin">c</p></section>'
                + '<p deliveryTarget="pdf">d</p><p product="kit">e</p><p rev="2" audience="user">f</p>'
                + '<p rev="1">g</p><!-- <p audience="admin">h</p> --><p outputclass="x">i</p><p audience="a&amp;b">j</p></topic>';
            const marks = conditionMarks(text, filter);
            const at = (span: MarkSpan) => text.slice(span.start, span.end);
            assert.deepStrictEqual(marks.excluded.map(at), ['<section platform="mac"><p audience="admin">c</p></section>']);
            assert.strictEqual(marks.flagged.length, 2, 'the same look shares one mark');
            const [red, yellow] = marks.flagged;
            assert.deepStrictEqual(red.spans.map(at), ['<p audience="admin">a</p>', '<p deliveryTarget="pdf">d</p>',
                '<p product="kit">e</p>', '<p audience="a&amp;b">j</p>'],
                'the filter-wide flag (deliveryTarget included), a value\'s own flag; not inside excluded content or comments');
            assert.deepStrictEqual(red.spans[1].values, { deliverytarget: 'pdf' });
            assert.deepStrictEqual(red.spans[3].values, { audience: 'a&b' }, 'decoded');
            assert.deepStrictEqual(yellow.spans.map(at), ['<p rev="2" audience="user">f</p>'], '@rev by <revprop>');

            const look = flagLook(red.style);
            assert.strictEqual(look.backgroundColor, 'color-mix(in srgb, red 15%, transparent)');
            assert.strictEqual(look.overviewRulerColor, 'red');
            assert.strictEqual(look.textDecoration, 'underline');
            assert.deepStrictEqual(look.before, { contentText: '[!]', color: 'red', backgroundColor: look.backgroundColor, margin: '0 0.3em 0 0' });
            assert.strictEqual(look.after, undefined);
            assert.strictEqual(flagLook(yellow.style).backgroundColor, 'color-mix(in srgb, yellow 30%, transparent)');
            assert.strictEqual(flagKey(red.style), flagKey({ ...red.style }));
            assert.notStrictEqual(flagKey(red.style), flagKey(yellow.style));

            // Styles, image-only flags, no look of their own, and colours that are not CSS colours.
            assert.deepStrictEqual(flagLook({ style: 'bold italics double-underline overline' }),
                { backgroundColor: undefined, overviewRulerColor: undefined, fontWeight: 'bold', fontStyle: 'italic',
                    textDecoration: 'underline overline double', before: undefined, after: undefined });
            assert.strictEqual(flagLook({ endImage: 'flag.png' }).after?.contentText, '⚑');
            assert.strictEqual(flagLook({}).textDecoration, 'underline dotted');
            assert.strictEqual(flagLook({ color: 'red; background: url(x)' }).overviewRulerColor, undefined);
            assert.strictEqual(flagLook({ color: '#c00', backcolor: 'rgb(255, 238, 0)' }).backgroundColor, 'color-mix(in srgb, rgb(255, 238, 0) 30%, transparent)');

            const none = buildDitavalFilter('<val/>', p('filters', 'none.ditaval'));
            assert.deepStrictEqual(conditionMarks(text, none), { excluded: [], flagged: [] });

            // The @props specializations the root element declares, as the preview finds them.
            const declared = '<?xml version="1.0"?>\n<!-- <topic domains="a(props other)"> -->\n'
                + '<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd" [ <!ENTITY e "x"> ]>\n'
                + '<topic id="t" domains="(topic hi-d) a(props jobrole)"><p jobrole="admin">a</p><p other="x">b</p></topic>';
            const flagged = (source: string) => conditionMarks(source, filter).flagged.flatMap((f) => f.spans.map((s) => source.slice(s.start, s.end)));
            assert.deepStrictEqual(flagged(declared), ['<p jobrole="admin">a</p>']);
            assert.deepStrictEqual(flagged('<topic specializations="@props/jobrole"><p jobrole="admin">a</p></topic>'), ['<p jobrole="admin">a</p>']);
            assert.deepStrictEqual(flagged('<topic><p jobrole="admin">a</p></topic>'), [], 'undeclared: not a filtering attribute');
            const d = parse(declared.replace(/<!DOCTYPE[^\]]*\]>\n/, ''));
            assert.deepStrictEqual(filter.evaluate(findElements(d, 'p')[0])?.flags, conditionMarks(declared, filter).flagged.map((f) => f.style), 'the preview agrees');
        });
    });

    suite('problems (spec §11.1)', () => {
        test('diagnostics map to element chains, errors first, hints dropped', () => {
            const src = '<topic id="t"><title>T</title><body><p>bad</p></body></topic>';
            const index = new ElementIndex(parse(src));
            const items = mapProblems([
                { start: src.indexOf('bad'), line: 1, severity: 'warning', message: 'w' },
                { start: src.indexOf('<title>'), line: 1, severity: 'error', message: 'e', code: 'DITA-X' },
                { start: 0, line: 1, severity: 'hint', message: 'h' },
            ], index);
            assert.deepStrictEqual(items.map((i) => [i.severity, i.ids[0]]), [['error', 'e1'], ['warning', 'e3']]);
            assert.deepStrictEqual(items[1].ids, ['e3', 'e2', 'e0']);
        });
    });

    suite('grammar selection (spec §4.5)', () => {
        let registry: GrammarRegistry;
        let tmp: string;

        suiteSetup(() => {
            tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ditacraft-registry-'));
            let grammarsDir = path.join(REPO_ROOT, 'out', 'grammars');
            if (!fs.existsSync(path.join(grammarsDir, 'index.json'))) {
                grammarsDir = path.join(tmp, 'grammars');
                buildBundledGrammars({ dtdsDir: DTDS_DIR, outDir: grammarsDir });
            }
            registry = new GrammarRegistry(REPO_ROOT, path.join(tmp, 'cache'), () => undefined, grammarsDir);
        });
        suiteTeardown(() => {
            fs.rmSync(tmp, { recursive: true, force: true });
        });

        const select = (src: string, ditaVersion?: string) => registry.select(parse(src), { ditaVersion });

        test('DOCTYPE PUBLIC id picks its shell and version', () => {
            const g = select('<!DOCTYPE concept PUBLIC "-//OASIS//DTD DITA Concept//EN" "concept.dtd"><concept id="c"/>');
            assert.strictEqual(g.id, 'dita-1.3/concept');
            assert.strictEqual(g.label, 'DITA 1.3 concept');
            assert.strictEqual(g.fallback, false);
            assert.strictEqual(g.classOf('p'), '- topic/p ');
            assert.strictEqual(select('<!DOCTYPE concept PUBLIC "-//OASIS//DTD DITA 1.2 Concept//EN" "c.dtd"><concept id="c"/>').id, 'dita-1.2/concept');
        });

        test('an unversioned PUBLIC id follows ditacraft.ditaVersion', () => {
            assert.strictEqual(select('<!DOCTYPE task PUBLIC "-//OASIS//DTD DITA Task//EN" "task.dtd"><task id="t"/>', '1.2').id, 'dita-1.2/task');
        });

        test('no DOCTYPE: the root element names the shell', () => {
            const g = select('<task id="t"><title>T</title></task>');
            assert.strictEqual(g.id, 'dita-1.3/task');
            assert.match(g.label, /no DOCTYPE/);
        });

        test('an unknown grammar falls back to the composite', () => {
            const g = select('<!DOCTYPE warranty PUBLIC "-//ACME//DTD Warranty//EN" "w.dtd"><warranty/>');
            assert.strictEqual(g.id, 'dita-1.3/ditabase');
            assert.strictEqual(g.fallback, true);
            assert.strictEqual(g.classOf('note'), '- topic/note ');
        });

        test('internal-subset entities take precedence over grammar entities', () => {
            const g = select('<!DOCTYPE topic PUBLIC "-//OASIS//DTD DITA Topic//EN" "topic.dtd" [<!ENTITY prod "AquaFlow">]><topic id="t"/>');
            assert.strictEqual(g.entity('prod'), 'AquaFlow');
        });

        test('versionFor: PUBLIC id, then setting, then @DITAArchVersion', () => {
            assert.strictEqual(versionFor('-//OASIS//DTD DITA 2.0 Base Topic//EN', '1.2', undefined), '2.0');
            assert.strictEqual(versionFor('-//OASIS//DTD DITA Topic//EN', '1.2', '1.3'), '1.2');
            assert.strictEqual(versionFor(undefined, 'auto', '1.2'), '1.2');
            assert.strictEqual(versionFor(undefined, 'auto', undefined), '1.3');
            assert.strictEqual(versionFor(undefined, '1.1', undefined), '1.2');
        });
    });
});
