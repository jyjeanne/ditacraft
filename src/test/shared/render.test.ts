/**
 * Preview Renderer Test Suite (visual preview, spec §6 and §9).
 *
 * Golden-fragment checks of the DITA-OT 4.2.1 tag + class contract and of every
 * preview-specific behaviour (specialization fallback, entities, whitespace, tables,
 * tasks, footnotes, resolutions, DITAVAL, markup toggles, foreign content).
 */

import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import { ElementIndex } from '../../shared/cst/elementIndex';
import { parse } from '../../shared/cst/parse';
import { doctypeInternalSubset, findElementById, findElements } from '../../shared/cst/query';
import type { ElementNode } from '../../shared/cst/types';
import { internalSubsetEntities } from '../../shared/render/html';
import { labelsFor } from '../../shared/render/labels';
import { findPatchRoot, needsFullRender, renderDocument, renderElement } from '../../shared/render/toHtml';
import type { FilterDecision, RenderOptions, Resolution } from '../../shared/render/types';
import { corpusFiles, ditabaseGrammar } from './helpers';

/** @class defaults from the composite grammar, as the extension host supplies them. */
function grammarOptions(): RenderOptions {
    const grammar = ditabaseGrammar();
    return {
        classOf: (name) => grammar.elements[name]?.class,
        entity: (name) => grammar.entities[name],
    };
}

function render(src: string, options: RenderOptions = {}): string {
    return renderDocument(parse(src), { ...grammarOptions(), ...options }).html;
}

/** Strip the preview-only data attributes to compare against the DITA-OT contract. */
function contract(html: string): string {
    return html.replace(/ data-(?:dita|class|struct-id)="[^"]*"/g, '');
}

const CONCEPT = '<concept id="c"><title>About the AquaFlow 300</title>'
    + '<shortdesc>A compact circulation pump.</shortdesc>'
    + '<conbody><p>The pump in <codeph>src/dita</codeph> runs <b>quietly</b>.</p></conbody></concept>';

suite('Visual Preview: renderer', () => {
    suite('DITA-OT class contract', () => {
        test('concept: article, title, shortdesc, body, p, codeph, b', () => {
            const html = contract(render(CONCEPT));
            assert.ok(html.includes('<article class="topic concept nested0" role="article">'), html);
            assert.ok(html.includes('<h1 class="title topictitle1">About the AquaFlow 300</h1>'), html);
            assert.ok(html.includes('<p class="shortdesc">A compact circulation pump.</p>'), html);
            assert.ok(html.includes('<div class="body conbody">'), html);
            assert.ok(html.includes('<p class="p">The pump in <code class="ph codeph">src/dita</code> runs <strong class="ph b">quietly</strong>.</p>'), html);
        });

        test('lists, outputclass and nested lists', () => {
            const html = contract(render('<topic id="t"><title>T</title><body><ul outputclass="tight"><li>one<ul><li>two</li></ul></li></ul><ol><li>a</li></ol></body></topic>'));
            assert.ok(html.includes('<ul class="ul tight"><li class="li">one<ul class="ul"><li class="li">two</li></ul></li></ul>'), html);
            assert.ok(html.includes('<ol class="ol"><li class="li">a</li></ol>'), html);
        });

        test('every element carries data-dita, data-struct-id and (with a class) data-class', () => {
            const doc = parse('<topic id="t" class="- topic/topic "><title class="- topic/title ">T</title></topic>');
            const html = renderDocument(doc, { index: new ElementIndex(doc) }).html;
            assert.ok(html.includes('data-dita="topic" data-class="- topic/topic " data-struct-id="e0"'), html);
            assert.ok(html.includes('data-dita="title" data-class="- topic/title " data-struct-id="e1"'), html);
        });

        test('nested topics and section titles step down heading levels', () => {
            const html = contract(render('<topic id="a"><title>A</title><body><section><title>S</title></section></body><topic id="b"><title>B</title></topic></topic>'));
            assert.ok(html.includes('<h2 class="title sectiontitle">S</h2>'), html);
            assert.ok(html.includes('<article class="topic topic nested1" role="article"><h2 class="title topictitle2">B</h2>'), html);
        });

        test('a paragraph holding block content becomes a div', () => {
            const html = contract(render('<topic><title>T</title><body><p>Intro<ul><li>x</li></ul></p></body></topic>'));
            assert.ok(html.includes('<div class="p">Intro<ul class="ul">'), html);
        });
    });

    suite('specializations and unknown elements', () => {
        test('a specialized element renders like its base (class-token fallback)', () => {
            const html = contract(render('<topic><title>T</title><body>'
                + '<warning class="+ topic/note acme-d/warning " type="caution">Hot</warning>'
                + '<p>Use <productname class="+ topic/ph acme-d/productname ">AquaFlow</productname></p></body></topic>'));
            assert.ok(html.includes('<div class="note note_caution" data-type="caution"><span class="note__title">CAUTION:</span> Hot</div>'), html);
            assert.ok(html.includes('<span class="ph">AquaFlow</span>'), html);
        });

        test('grammar @class defaults drive dispatch when instances carry no @class', () => {
            const classOf = (name: string) => ({ topic: '- topic/topic ', title: '- topic/title ', body: '- topic/body ', alert: '+ topic/note acme-d/alert ' } as Record<string, string>)[name];
            const html = render('<topic><title>T</title><body><alert>Careful</alert></body></topic>', { classOf });
            assert.ok(html.includes('class="note note_note"'), html);
            assert.ok(html.includes('data-class="+ topic/note acme-d/alert "'), html);
        });

        test('an element with no class and no rule is a labelled box', () => {
            const out = renderDocument(parse('<topic><title>T</title><body><warranty><p>Two years</p></warranty></body></topic>'));
            assert.ok(out.html.includes('<div class="dc-unknown" data-dita="warranty"><span class="dc-tag">warranty</span><p'), out.html);
            assert.deepStrictEqual(out.unknownElements, ['warranty']);
        });

        test('standard OASIS names dispatch correctly even without a grammar', () => {
            const html = contract(renderDocument(parse('<task><title>T</title><taskbody><steps><step><cmd>Go</cmd></step></steps>'
                + '<postreq><codeblock>a\n b</codeblock></postreq></taskbody></task>')).html);
            assert.ok(html.includes('<h1 class="title topictitle1">T</h1>'), html);
            assert.ok(html.includes('<ol class="ol steps"><li class="li step stepexpand"><span class="ph cmd">Go</span></li></ol>'), html);
            assert.ok(html.includes('<h2 class="title sectiontitle tasklabel">What to do next</h2><pre class="pre codeblock"><code>a\n b</code></pre>'), html);
        });

        test('the classless dita composite root is a transparent container', () => {
            const html = contract(render('<dita><concept id="a"><title>A</title></concept><task id="b"><title>B</title></task></dita>'));
            assert.ok(html.startsWith('<div class="dita-composite">'), html);
            assert.ok(!html.includes('dc-unknown'), html);
        });
    });

    suite('text, entities and whitespace', () => {
        test('decodes predefined, numeric, grammar and internal-subset entities', () => {
            const src = '<!DOCTYPE topic [\n<!ENTITY prod "AquaFlow">\n]><topic><title>A &amp; B &#x41;&#66; &prod; &trade;</title></topic>';
            const doc = parse(src);
            const subset = internalSubsetEntities(doctypeInternalSubset(doc));
            const out = renderDocument(doc, { entity: (n) => subset.get(n) ?? (n === 'trade' ? '™' : undefined) });
            assert.ok(out.html.includes('>A &amp; B AB AquaFlow ™</h1>'), out.html);
            assert.deepStrictEqual(out.undeclaredEntities, []);
        });

        test('internal-subset entity expansion is bounded (billion laughs)', () => {
            const levels = ['<!ENTITY a "lol">'];
            for (let i = 1; i <= 10; i++) {
                levels.push(`<!ENTITY ${String.fromCharCode(97 + i)} "${`&${String.fromCharCode(96 + i)};`.repeat(10)}">`);
            }
            const started = Date.now();
            const subset = internalSubsetEntities(levels.join('\n'));
            assert.ok(Date.now() - started < 1000, 'expansion must be fast');
            for (const value of subset.values()) {
                assert.ok(value.length <= 10000, `entity expanded to ${value.length} chars`);
            }
            const html = renderDocument(parse('<topic><title>&k;</title></topic>'), { entity: (n) => subset.get(n) }).html;
            assert.ok(html.length < 20000, `rendered ${html.length} chars`);
        });

        test('keeps undeclared entities as literal text and reports them', () => {
            const out = renderDocument(parse('<topic><title>a&nbsp;b</title></topic>'));
            assert.ok(out.html.includes('a&amp;nbsp;b'), out.html);
            assert.deepStrictEqual(out.undeclaredEntities, ['nbsp']);
        });

        test('collapses layout whitespace but keeps spaces around inline elements', () => {
            const html = contract(render('<topic><title>T</title><body><p>\n   One <b>two</b>\n   three  </p></body></topic>'));
            assert.ok(html.includes('<p class="p">One <strong class="ph b">two</strong> three</p>'), html);
        });

        test('codeblock, lines and xml:space preserve whitespace; CDATA is text', () => {
            const html = contract(render('<topic><title>T</title><body><codeblock outputclass="language-xml">a\n  b<![CDATA[<x/>]]></codeblock><lines>l1\nl2</lines><p xml:space="preserve">x  y</p></body></topic>'));
            assert.ok(html.includes('<pre class="pre codeblock language-xml" data-lang="xml"><code>a\n  b&lt;x/&gt;</code></pre>'), html);
            assert.ok(html.includes('<div class="lines">l1\nl2</div>'), html);
            assert.ok(html.includes('<p class="p">x  y</p>'), html);
        });
    });

    suite('notes, figures, tables', () => {
        test('note types use localized labels', () => {
            const src = '<topic><title>T</title><body><note>a</note><note type="tip">b</note><note type="other" othertype="Hint">c</note></body></topic>';
            const en = contract(render(src));
            assert.ok(en.includes('<span class="note__title">Note:</span> a'), en);
            assert.ok(en.includes('<div class="note note_tip" data-type="tip"><span class="note__title">Tip:</span> b'), en);
            assert.ok(en.includes('<span class="note__title">Hint:</span> c'), en);
            const fr = contract(render(src, { labels: labelsFor('fr') }));
            assert.ok(fr.includes('<span class="note__title">Remarque:</span> a'), fr);
        });

        test('figures and tables are numbered in document order, labels localized', () => {
            const src = '<topic><title>T</title><body><fig><title>Pump</title><image href="p.png"/></fig><fig><image href="q.png"/></fig>'
                + '<table><title>Specs</title><tgroup cols="1"><tbody><row><entry>x</entry></row></tbody></tgroup></table>'
                + '<fig frame="all"><title>Valve</title></fig></body></topic>';
            const html = contract(render(src, { labels: labelsFor('fr') }));
            assert.ok(html.includes('<figure class="fig fignone"><figcaption><span class="fig--title-label">Figure 1. </span><span class="fig--title">Pump</span></figcaption>'), html);
            assert.ok(html.includes('<figure class="fig figborder"><figcaption><span class="fig--title-label">Figure 2. </span>'), html);
            assert.ok(html.includes('<caption><span class="table--title-label">Tableau 1. </span><span class="title">Specs</span></caption>'), html);
        });

        test('CALS spans, column widths, header association and alignment', () => {
            const src = '<topic><title>T</title><body><table frame="all"><tgroup cols="3" align="left">'
                + '<colspec colname="c1" colwidth="1*"/><colspec colname="c2" colwidth="3*"/><colspec colname="c3" colwidth="1*"/>'
                + '<thead><row><entry namest="c1" nameend="c2">H12</entry><entry>H3</entry></row></thead>'
                + '<tbody><row><entry morerows="1" valign="middle">a</entry><entry>b</entry><entry align="right">c</entry></row>'
                + '<row><entry>d</entry><entry>e</entry></row></tbody></tgroup></table></body></topic>';
            const html = contract(render(src));
            assert.ok(html.includes('<table class="table frame-all">'), html);
            assert.ok(html.includes('<col style="width:20.00%"><col style="width:60.00%"><col style="width:20.00%">'), html);
            assert.ok(html.includes('<th class="entry" colspan="2" id="dch-doc-r0-0-0" scope="colgroup" style="text-align:left">H12</th>'), html);
            assert.ok(html.includes('<td class="entry" rowspan="2" headers="dch-doc-r0-0-0" style="text-align:left;vertical-align:middle">a</td>'), html);
            assert.ok(html.includes('<td class="entry" headers="dch-doc-r0-0-1" style="text-align:right">c</td>'), html);
        });

        test('simpletable keycol, and generated choicetable headers', () => {
            const html = contract(render('<task><title>T</title><taskbody><steps><step><cmd>Pick</cmd>'
                + '<choicetable class="- topic/simpletable task/choicetable "><chrow class="- topic/strow task/chrow "><choption class="- topic/stentry task/choption ">A</choption><chdesc class="- topic/stentry task/chdesc ">first</chdesc></chrow></choicetable>'
                + '</step></steps></taskbody></task>'));
            assert.ok(html.includes('<thead><tr class="sthead dc-generated"><th scope="col">Option</th><th scope="col">Description</th></tr></thead>'), html);
            const st = contract(render('<topic><title>T</title><body><simpletable keycol="1" relcolwidth="1* 1*"><strow><stentry>k</stentry><stentry>v</stentry></strow></simpletable></body></topic>'));
            assert.ok(st.includes('<th class="stentry" scope="row">k</th><td class="stentry">v</td>'), st);
        });
    });

    suite('tasks, footnotes, links', () => {
        test('task sections get labels; steps, cmd, info, optional importance', () => {
            const html = contract(render('<task id="t"><title>Install</title><taskbody><prereq><p>Power off.</p></prereq>'
                + '<steps><step importance="optional"><cmd>Open the cover.</cmd><info>Use a screwdriver.</info></step></steps>'
                + '<result><p>Done.</p></result></taskbody></task>'));
            assert.ok(html.includes('<section class="section prereq"><h2 class="title sectiontitle tasklabel">Before you begin</h2>'), html);
            assert.ok(html.includes('<ol class="ol steps"><li class="li step stepexpand"><span class="step__importance">Optional: </span><span class="ph cmd">Open the cover.</span><div class="itemgroup info">Use a screwdriver.</div></li></ol>'), html);
            assert.ok(html.includes('<h2 class="title sectiontitle tasklabel">Results</h2>'), html);
        });

        test('footnotes are numbered and collected at the end', () => {
            const html = contract(render('<topic><title>T</title><body><p>A<fn>first</fn> B<fn callout="*">second</fn></p></body></topic>'));
            assert.ok(html.includes('A<sup class="fn">1</sup> B<sup class="fn">*</sup>'), html);
            assert.ok(html.includes('<div class="fn"><sup class="fnnum">1</sup> first</div><div class="fn"><sup class="fnnum">*</sup> second</div>'), html);
        });

        test('xref: href kept as data, external scope marked, empty xref shows its target', () => {
            const html = contract(render('<topic><title>T</title><body><p><xref href="other.dita">See</xref> <xref href="https://example.com" scope="external"/></p></body></topic>'));
            assert.ok(html.includes('<a class="xref" data-href="other.dita" title="Ctrl+click to open">See</a>'), html);
            assert.ok(html.includes('<a class="xref dc-external" data-href="https://example.com" data-scope="external" title="Ctrl+click to open">https://example.com</a>'), html);
            assert.ok(!html.includes(' href='), 'no navigable href inside the preview');
        });

        test('related links render as a localized list', () => {
            const html = contract(render('<topic><title>T</title><related-links><link href="a.dita"><linktext>A</linktext></link></related-links></topic>'));
            assert.ok(html.includes('<nav class="related-links" role="navigation"><div class="linklist relinfo"><strong>Related information</strong><ul class="linklist"><li class="link ulchildlink"><a class="link" data-href="a.dita">A</a></li></ul></div></nav>'), html);
        });
    });

    suite('resolutions (spec §7)', () => {
        test('keyref text fills an empty element; unresolved keys show a placeholder', () => {
            const doc = parse('<topic><title>T</title><body><p><ph keyref="product"/> and <ph keyref="nope"/></p></body></topic>');
            const [ok, missing] = findElements(doc, 'ph');
            const resolutions = new Map<ElementNode, Resolution>([
                [ok, { kind: 'key', key: 'product', text: 'AquaFlow 300' }],
                [missing, { kind: 'key', key: 'nope', unresolved: 'key not defined' }],
            ]);
            const html = renderDocument(doc, { resolutions }).html;
            assert.ok(html.includes('data-resolved="key" data-key="product" title="From key &quot;product&quot; — Ctrl+click to open">AquaFlow 300</span>'), html);
            assert.ok(html.includes('class="ph dc-unresolved"'), html);
            assert.ok(html.includes('<span class="dc-placeholder">[nope]</span>'), html);
        });

        test('conref replaces the children; a conrefend range renders whole elements', () => {
            const target = parse('<topic id="lib"><title>L</title><body><note id="n">Shared <b>note</b></note><p id="p1">one</p><p id="p2">two</p></body></topic>');
            const doc = parse('<topic><title>T</title><body><note conref="lib.dita#lib/n"/><p conref="lib.dita#lib/p1" conrefend="lib.dita#lib/p2"/></body></topic>');
            const note = findElements(doc, 'note')[0];
            const para = findElements(doc, 'p')[0];
            const resolutions = new Map<ElementNode, Resolution>([
                [note, { kind: 'conref', from: 'lib.dita#lib/n', conrefChildren: findElementById(target.children, 'n')!.children, sourceDoc: target }],
                [para, { kind: 'conref', from: 'lib.dita#lib/p1', conrefRange: [findElementById(target.children, 'p1')!, findElementById(target.children, 'p2')!], sourceDoc: target }],
            ]);
            const html = contract(renderDocument(doc, { resolutions }).html);
            assert.ok(html.includes('<div class="note note_note dc-conref" data-resolved="conref" data-resolved-from="lib.dita#lib/n"'), html);
            assert.ok(html.includes('<span class="note__title">Note:</span> Shared <strong class="ph b">note</strong></div>'), html);
            assert.ok(html.includes('<div class="dc-conref-range dc-conref" data-resolved="conref" data-resolved-from="lib.dita#lib/p1"'), html);
            assert.ok(html.includes('<p class="p">one</p><p class="p">two</p></div>'), html);
        });
    });

    suite('DITAVAL (spec §11.3)', () => {
        const src = '<topic><title>T</title><body><p audience="admin">Admin</p><p audience="user">User</p></body></topic>';
        const filter = (el: ElementNode): FilterDecision | undefined => {
            const audience = el.attrs.find((a) => a.name === 'audience')?.value;
            if (audience === 'admin') {
                return { excluded: true, flags: [] };
            }
            if (audience === 'user') {
                return { excluded: false, flags: [{ color: 'red', backcolor: '#ffffcc', style: 'bold', startText: '[user]' }] };
            }
            return undefined;
        };

        test('excluded content is removed, flagged content styled', () => {
            const html = contract(render(src, { filter }));
            assert.ok(!html.includes('Admin'), html);
            assert.ok(html.includes('<p class="p dc-flagged" style="color:red;background-color:#ffffcc;font-weight:bold"><span class="dc-flag">[user]</span>User</p>'), html);
        });

        test('showExcluded dims instead of removing', () => {
            const html = contract(render(src, { filter, showExcluded: true }));
            assert.ok(html.includes('<p class="p dc-excluded">Admin</p>'), html);
        });
    });

    suite('review regressions', () => {
        test('DITAVAL applies to table rows, cells, simple-table rows and entries', () => {
            const filter = (el: ElementNode): FilterDecision | undefined =>
                el.attrs.some((a) => a.name === 'product' && a.value === 'internal') ? { excluded: true, flags: [] } : undefined;
            const html = render('<topic><title>T</title><body><table><tgroup cols="1"><tbody>'
                + '<row><entry>public</entry></row><row product="internal"><entry>secret row</entry></row>'
                + '<row><entry product="internal">secret cell</entry></row></tbody></tgroup></table>'
                + '<simpletable><strow product="internal"><stentry>hidden</stentry></strow><strow><stentry product="internal">gone</stentry></strow></simpletable>'
                + '</body></topic>', { filter });
            assert.ok(html.includes('public'), html);
            assert.ok(!/secret row|secret cell|hidden|gone/.test(html), html);
        });

        test('flag markers are not emitted for elements that render nothing', () => {
            const filter = (): FilterDecision => ({ excluded: false, flags: [{ startText: '[F]' }] });
            const html = render('<topic><title>T</title><body><p>x<indexterm>term</indexterm></p></body></topic>', {
                filter: (el) => (el.name === 'indexterm' ? filter() : undefined),
            });
            assert.ok(!html.includes('[F]'), html);
        });

        test('footnotes referenced through <xref type="fn"> are numbered and listed', () => {
            const html = contract(render('<topic id="t"><title>T</title><body><p>A<fn>plain</fn> B<xref type="fn" href="#t/f1"/></p>'
                + '<p><fn id="f1">by reference</fn></p></body></topic>'));
            assert.ok(html.includes('A<sup class="fn">1</sup> B<sup class="fn">2</sup>'), html);
            assert.ok(html.includes('<sup class="fnnum">2</sup> by reference'), html);
            assert.ok(!html.includes('>by reference</a>'), html);
        });

        test('table header ids are unique across tables and stable for patches', () => {
            const doc = parse('<topic><title>T</title><body>'
                + '<table><tgroup cols="1"><thead><row><entry>H</entry></row></thead><tbody><row><entry>a</entry></row></tbody></tgroup></table>'
                + '<table><tgroup cols="1"><thead><row><entry>H</entry></row></thead><tbody><row><entry>b</entry></row></tbody></tgroup></table>'
                + '</body></topic>');
            const index = new ElementIndex(doc);
            const html = renderDocument(doc, { ...grammarOptions(), index }).html;
            const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
            assert.strictEqual(new Set(ids).size, ids.length, `duplicate ids: ${ids.join(',')}`);
            const second = findElements(doc, 'table')[1];
            const patch = renderElement(doc, second, { ...grammarOptions(), index });
            for (const id of [...patch.matchAll(/ id="([^"]+)"/g)].map((m) => m[1])) {
                assert.ok(ids.includes(id), `patched table uses a different header id: ${id}`);
            }
        });

        test('a patch target inside a table cell, figure title or codeblock widens to a self-contained ancestor', () => {
            const doc = parse('<topic><title>T</title><body><table><tgroup cols="1"><tbody><row><entry><ph keyref="k"/></entry></row></tbody></tgroup></table>'
                + '<fig><title><ph keyref="k"/></title></fig><codeblock>a  <ph keyref="k"/></codeblock><p><ph keyref="k"/></p></body></topic>');
            const [inCell, inTitle, inCode, inPara] = findElements(doc, 'ph');
            const opts = grammarOptions();
            assert.strictEqual(findPatchRoot(inCell, opts).name, 'table');
            assert.strictEqual(findPatchRoot(inTitle, opts).name, 'fig');
            assert.strictEqual(findPatchRoot(inCode, opts).name, 'codeblock');
            assert.strictEqual(findPatchRoot(inPara, opts).name, 'ph');
        });
    });

    suite('markup toggle', () => {
        const src = '<topic><title>T</title><prolog><author>Ann Writer</author><critdates><created date="2026-09-01"/></critdates></prolog>'
            + '<body><p>Text<indexterm>pumps</indexterm><!-- todo --><draft-comment author="Ann">check</draft-comment></p></body></topic>';

        test('metadata, index terms, comments and draft comments are hidden by default', () => {
            const html = contract(render(src));
            assert.ok(!html.includes('Ann Writer') && !html.includes('pumps') && !html.includes('todo') && !html.includes('check'), html);
            assert.ok(html.includes('<p class="p">Text</p>'), html);
        });

        test('Show markup reveals them', () => {
            const html = render(src, { showMarkup: true });
            assert.ok(html.includes('<span class="dc-meta-name">author</span> Ann Writer'), html);
            assert.ok(html.includes('<span class="dc-meta-name">created</span> <span class="dc-meta-attrs">date="2026-09-01"</span>'), html);
            assert.ok(html.includes('⌖ pumps'), html);
            assert.ok(html.includes('&lt;!-- todo --&gt;'), html);
            assert.ok(html.includes('draft-comment (Ann)'), html);
        });
    });

    suite('images and foreign content', () => {
        test('images: src through imageSrc, alt, size, break alignment, missing image', () => {
            const seen: string[] = [];
            const imageSrc = (href: string) => {
                seen.push(href);
                return href === 'missing.png' ? undefined : `vscode-resource:/topic/${href}`;
            };
            const html = contract(render('<topic><title>T</title><body><fig><image href="pump.svg" width="300" placement="break" align="center"><alt>The pump</alt></image></fig>'
                + '<p><image href="missing.png"/></p></body></topic>', { imageSrc }));
            assert.deepStrictEqual(seen, ['pump.svg', 'missing.png']);
            assert.ok(html.includes('<div class="image-break imagecenter"><img class="image imagecenter" src="vscode-resource:/topic/pump.svg" alt="The pump" loading="lazy" style="width:300px"></div>'), html);
            assert.ok(html.includes('<span class="image dc-missing-image" role="img" aria-label="missing.png">missing.png</span>'), html);
        });

        test('the MathML/SVG sanitizer allowlists names, checks local names and drops styles and HTML islands', () => {
            const html = render('<topic><title>T</title><body><p><mathml><m:math xmlns:m="http://www.w3.org/1998/Math/MathML">'
                + '<m:mi m:onclick="alert(1)" mathvariant="bold">x</m:mi><m:p>breakout</m:p><m:img src="x"/>'
                + '<m:semantics><m:mn>1</m:mn><m:annotation-xml encoding="text/html"><b>html</b></m:annotation-xml></m:semantics></m:math></mathml>'
                + '<svg-container><svg:svg xmlns:svg="http://www.w3.org/2000/svg"><svg:Style>*{display:none}</svg:Style><svg:foreignobject><p>x</p></svg:foreignobject>'
                + '<svg:a svg:href="https://evil.example">link</svg:a><svg:rect style="position:fixed" width="5" x\u000conclick="1"/></svg:svg></svg-container></p></body></topic>');
            assert.ok(html.includes('<mi mathvariant="bold">x</mi>'), html);
            assert.ok(!/onclick|evil|style|display:none|<p>x|<b>html|<img|<a[\s>]/i.test(html.replace(/<p class="p"[^>]*>|<\/p>/g, '')), html);
            assert.ok(html.includes('breakout'), 'text of a dropped wrapper is kept');
            assert.ok(html.includes('<rect width="5"></rect>'), html);
        });

        test('MathML and SVG are passed through without prefixes, scripts or external references', () => {
            const html = render('<topic><title>T</title><body><p><mathml><m:math xmlns:m="http://www.w3.org/1998/Math/MathML"><m:mi>x</m:mi></m:math></mathml>'
                + '<svg-container><svg:svg xmlns:svg="http://www.w3.org/2000/svg" onload="alert(1)"><svg:script>x</svg:script><svg:use xlink:href="#a"/><svg:image href="http://evil/x.png"/></svg:svg></svg-container></p></body></topic>');
            assert.ok(html.includes('<math><mi>x</mi></math>'), html);
            assert.ok(html.includes('<svg><use href="#a"></use><image></image></svg>'), html);
            assert.ok(!/onload|script|evil/.test(html), html);
        });
    });

    suite('incremental patches', () => {
        test('renderElement uses document-wide numbering and ids; footnotes force a full render', () => {
            const doc = parse('<topic><title>T</title><body><fig><title>A</title></fig><fig><title>B</title></fig><p>x<fn>n</fn></p></body></topic>');
            const index = new ElementIndex(doc);
            const second = findElements(doc, 'fig')[1];
            const html = renderElement(doc, second, { index });
            assert.ok(html.includes('Figure 2. '), html);
            assert.ok(html.includes(`data-struct-id="${index.idOf(second)}"`), html);
            assert.strictEqual(needsFullRender(second), false);
            assert.strictEqual(needsFullRender(findElements(doc, 'p')[0]), true);
        });
    });

    suite('corpus smoke test', () => {
        test('every corpus file renders, with struct ids, and no "undefined" leaks', () => {
            const failures: string[] = [];
            for (const file of corpusFiles()) {
                try {
                    const doc = parse(fs.readFileSync(file, 'utf8'));
                    const { html } = renderDocument(doc, { ...grammarOptions(), index: new ElementIndex(doc), showMarkup: true });
                    if (!html.includes('data-struct-id="e0"')) {
                        failures.push(`${path.basename(file)}: no struct ids`);
                    }
                    // The corpus documents DitaCraft itself, so the *word* "undefined" occurs in
                    // prose; only attribute values or object dumps indicate a renderer bug.
                    if (/="undefined"|\[object Object\]|>undefined</.test(html)) {
                        failures.push(`${path.basename(file)}: leaked "undefined"`);
                    }
                } catch (error) {
                    failures.push(`${path.basename(file)}: ${(error as Error).message}`);
                }
            }
            assert.deepStrictEqual(failures, []);
        });
    });
});
