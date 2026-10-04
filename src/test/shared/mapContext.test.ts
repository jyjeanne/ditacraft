/**
 * Map context Test Suite (spec §13.8, M4).
 *
 * The places where the maps of a workspace reference a topic — reached from each root map through
 * its submaps — and what each place says about the topic: the navigation above it, its key scope,
 * and the metadata the map passes down (merged profiling attributes, the nearest xml:lang).
 */

import * as assert from 'assert';
import * as path from 'path';
import { parse } from '../../shared/cst/parse';
import { rootElement } from '../../shared/cst/query';
import type { Document, ElementNode } from '../../shared/cst/types';
import { compileGrammar } from '../../shared/grammar/compiler';
import { classTokens } from '../../shared/grammar/classTokens';
import type { Grammar } from '../../shared/grammar/types';
import { readDtdGrammar } from '../../shared/grammar/typesxmlAdapter';
import { buildDitavalFilter } from '../../preview/ditaval';
import { findPlaces, occurrenceAt, placeLabel, referencesTo, samePlace } from '../../preview/mapContext';
import { DTDS_DIR } from './helpers';

const DIR = path.resolve('/project');
const at = (rel: string) => path.join(DIR, ...rel.split('/'));

let grammar: Grammar;
const tokensOf = (el: ElementNode): string[] => classTokens(grammar.elements[el.name]?.class ?? '');

function maps(files: Record<string, string>): Map<string, Document> {
    return new Map(Object.entries(files).map(([rel, text]) => [at(rel), parse(text)]));
}

const ROOT = ['<map xml:lang="fr">', '  <title>Field Guide</title>', '  <mapref href="a.ditamap" keyscope="a" audience="admin"/>',
    '  <mapref href="b.ditamap" keyscope="b"/>', '</map>'].join('\n');
const A = ['<map>', '  <title>Map A (not shown)</title>', '  <topichead navtitle="Setup" product="kit">',
    '    <topicref href="topics/shared.dita" audience="expert" platform="linux"/>', '  </topichead>',
    '  <keydef keys="k" href="topics/shared.dita"/>', '  <topicref href="topics/shared.dita" processing-role="resource-only"/>', '</map>'].join('\n');
const B = ['<map>', '  <topicref href="topics/other.dita">', '    <topicmeta><navtitle>Other</navtitle></topicmeta>',
    '    <topicref href="topics/shared.dita#t1" xml:lang="de"/>', '  </topicref>', '  <topicref href="topics/shared.dita" audience="novice" cascade="nomerge"/>', '</map>'].join('\n');
const C = ['<map title="Quick Card">', '  <topicref href="topics/shared.dita"/>',
    '  <reltable><relrow><relcell><topicref href="topics/shared.dita"/></relcell></relrow></reltable>', '</map>'].join('\n');

suite('Map context (spec §13.8 M4)', function () {
    this.timeout(120000);

    suiteSetup(() => {
        const { raw } = readDtdGrammar(path.join(DTDS_DIR, 'technicalContent', 'dtd', 'map.dtd'), path.join(DTDS_DIR, 'catalog.xml'));
        grammar = compileGrammar(raw, { id: 'dita-1.3/map', ditaVersion: '1.3', shell: 'technicalContent/dtd/map.dtd', publicIds: [] });
    });

    test('references to a topic: not its key definitions, not resource-only references; fragments count', () => {
        const doc = parse(A);
        assert.deepStrictEqual(referencesTo(doc, at('a.ditamap'), at('topics/shared.dita'), tokensOf).map((el) => el.name), ['topicref']);
        const b = parse(B);
        assert.strictEqual(referencesTo(b, at('b.ditamap'), at('topics/shared.dita'), tokensOf).length, 2);
        assert.strictEqual(referencesTo(b, at('b.ditamap'), at('topics/missing.dita'), tokensOf).length, 0);
    });

    test('places: from each root map through its submaps, the project\'s root map first', () => {
        const all = maps({ 'root.ditamap': ROOT, 'a.ditamap': A, 'b.ditamap': B, 'c.ditamap': C });
        const places = findPlaces(at('topics/shared.dita'), all, tokensOf, at('root.ditamap'));
        assert.deepStrictEqual(places.map((p) => [path.basename(p.root), p.maps.map((m) => path.basename(m)).join('>'), p.occurrence]), [
            ['root.ditamap', 'root.ditamap>a.ditamap', 0],
            ['root.ditamap', 'root.ditamap>b.ditamap', 0],
            ['root.ditamap', 'root.ditamap>b.ditamap', 1],
            ['c.ditamap', 'c.ditamap', 0],
        ]);
        // Without a preferred root: roots by path.
        assert.strictEqual(path.basename(findPlaces(at('topics/shared.dita'), all, tokensOf)[0].root), 'c.ditamap');
    });

    test('a place\'s trail, key scope and inherited metadata', () => {
        const all = maps({ 'root.ditamap': ROOT, 'a.ditamap': A, 'b.ditamap': B, 'c.ditamap': C });
        const [inA, inB, inB2, inC] = findPlaces(at('topics/shared.dita'), all, tokensOf, at('root.ditamap'));
        // A submap's title is not part of the navigation; a topic head's is.
        assert.deepStrictEqual(inA.info.trail, ['Field Guide', 'Setup']);
        assert.strictEqual(inA.info.scope, 'a');
        assert.deepStrictEqual(inA.info.inherited, { 'xml:lang': 'fr', audience: 'admin expert', product: 'kit', platform: 'linux' });
        assert.deepStrictEqual(inB.info.trail, ['Field Guide', 'Other']);
        assert.strictEqual(inB.info.scope, 'b');
        assert.strictEqual(inB.info.inherited['xml:lang'], 'de', 'the nearest language');
        assert.strictEqual(inB2.info.inherited.audience, 'novice', 'cascade="nomerge" replaces');
        assert.deepStrictEqual([inC.info.trail, inC.info.scope, inC.info.inherited], [['Quick Card'], '', {}]);
        assert.strictEqual(placeLabel(inA), 'Field Guide › Setup');
    });

    test('a map row\'s reference is a place; a place is found again after the maps change', () => {
        const all = maps({ 'root.ditamap': ROOT, 'a.ditamap': A, 'b.ditamap': B });
        const b = all.get(at('b.ditamap'))!;
        const second = referencesTo(b, at('b.ditamap'), at('topics/shared.dita'), tokensOf)[1];
        assert.strictEqual(occurrenceAt(b, at('b.ditamap'), at('topics/shared.dita'), second.range.start, tokensOf), 1);
        assert.strictEqual(occurrenceAt(b, at('b.ditamap'), at('topics/shared.dita'), rootElement(b)!.range.start, tokensOf), undefined);
        const places = findPlaces(at('topics/shared.dita'), all, tokensOf);
        const again = findPlaces(at('topics/shared.dita'), maps({ 'root.ditamap': ROOT, 'a.ditamap': A, 'b.ditamap': B }), tokensOf);
        assert.strictEqual(samePlace(again, places[2])?.occurrence, 1);
        assert.strictEqual(samePlace(again, { ...places[2], occurrence: 5 }), undefined);
    });

    test('the metadata a map gives a topic, against a DITAVAL filter', () => {
        const filter = buildDitavalFilter('<val><prop att="audience" val="admin" action="exclude"/><prop att="platform" val="mac" action="exclude"/></val>', at('f.ditaval'));
        assert.strictEqual(filter.excludes({ audience: 'admin' }), true);
        assert.strictEqual(filter.excludes({ audience: 'admin expert' }), false, 'one value still included');
        assert.strictEqual(filter.excludes({ audience: 'expert', platform: 'mac' }), true, 'any attribute excluding it');
        assert.strictEqual(filter.excludes({ product: 'kit' }), false, 'an attribute the filter does not name');
        assert.strictEqual(filter.excludes({}), false);
    });

    test('maps that reference each other: no endless walk; every map may then be a root', () => {
        const x = ['<map>', '  <mapref href="y.ditamap"/>', '  <topicref href="t.dita"/>', '</map>'].join('\n');
        const y = ['<map>', '  <mapref href="x.ditamap"/>', '</map>'].join('\n');
        const places = findPlaces(at('t.dita'), maps({ 'x.ditamap': x, 'y.ditamap': y }), tokensOf);
        assert.deepStrictEqual(places.map((p) => p.maps.map((m) => path.basename(m)).join('>')), ['x.ditamap', 'y.ditamap>x.ditamap']);
    });
});
