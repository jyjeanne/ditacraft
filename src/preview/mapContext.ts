/**
 * A topic's map context (spec §13.8, M4): the places where maps reference a topic, and what a
 * place says about it — the navigation above it, the key scope its keys resolve in, and the
 * metadata the map passes down to it (DITA's cascading: profiling and metadata attributes merged
 * from the root map down to the reference, `xml:lang` and `dir` from the nearest).
 *
 * A place is a reference to the topic in a map reached from a root map — through submaps
 * (`mapref`, `format="ditamap"`) — so that its keys are the root map's, in the scope of the
 * reference. Root maps are the maps of the workspace that no other map references.
 *
 * No `vscode` import: unit-tested with plain Mocha.
 */

import * as path from 'path';
import { attr, childElements, rawTextContent, rootElement } from '../shared/cst/query';
import type { Document, ElementNode } from '../shared/cst/types';
import { decodeXmlText } from '../shared/render/html';
import { parseReference, resolvePath } from './resolver';

export type TokensOf = (el: ElementNode) => string[];

/** What a place says about the topic. */
export interface PlaceInfo {
    /** What a reader sees above the topic: the root map's title, then the navigation titles of the references holding it. */
    trail: string[];
    /** The key scope of the reference: the `@keyscope`s above it (the first name of each), root first, joined with "." ("" for none). */
    scope: string;
    /** The attributes the map passes down to the topic: profiling and metadata merged, `xml:lang`, `dir` and `translate` from the nearest. */
    inherited: Record<string, string>;
}

/** A place where a map hierarchy references a topic. */
export interface MapPlace {
    /** The root map: where the keys are defined. */
    root: string;
    /** The maps from the root to the one holding the reference (the root first). */
    maps: string[];
    /** Which reference to the topic in the last map, in document order (0 for the first). */
    occurrence: number;
    info: PlaceInfo;
}

/** Attributes a reference does not pass down to the topic it references. */
const NOT_INHERITED = new Set([
    'id', 'class', 'href', 'keyref', 'keys', 'keyscope', 'format', 'scope', 'type', 'navtitle', 'locktitle', 'toc', 'print', 'search',
    'linking', 'collection-type', 'processing-role', 'chunk', 'copy-to', 'conref', 'conrefend', 'conaction', 'conkeyref', 'outputclass',
    'xtrf', 'xtrc', 'ditaarchversion', 'domains', 'specializations', 'title', 'anchorref', 'mapref', 'cascade', 'importance', 'status',
]);
/** Attributes taken from the nearest element that has them. */
const NEAREST = new Set(['xml:lang', 'dir', 'translate']);

function isMapFile(file: string): boolean {
    return /\.(ditamap|bookmap)$/i.test(file);
}

function plain(el: ElementNode): string {
    return decodeXmlText(rawTextContent(el)).replace(/\s+/g, ' ').trim();
}

/** The elements from the document's root down to `el` (both included). */
export function ancestry(el: ElementNode): ElementNode[] {
    const chain: ElementNode[] = [];
    for (let e: ElementNode | null | undefined = el; e; e = e.parent) {
        chain.unshift(e);
    }
    return chain;
}

/** Where a map's reference points, if it points to a local file: the file, and whether it is a map. */
function referenced(el: ElementNode, mapPath: string, tokensOf: TokensOf): { file: string; map: boolean } | undefined {
    const tokens = tokensOf(el);
    if (!tokens.includes('map/topicref')) {
        return undefined;
    }
    const href = attr(el, 'href');
    const scope = attr(el, 'scope');
    const format = attr(el, 'format');
    if (!href || scope === 'external' || scope === 'peer') {
        return undefined;
    }
    const value = decodeXmlText(href);
    if (/^[a-z][\w+.-]+:/i.test(value) && !/^file:/i.test(value)) {
        return undefined;
    }
    const ref = parseReference(value);
    if (!ref.file) {
        return undefined;
    }
    const file = resolvePath(mapPath, ref.file);
    const map = format === 'ditamap' || (format === undefined && isMapFile(file));
    if (!map && format !== undefined && format !== 'dita') {
        return undefined;
    }
    return { file, map };
}

/** Whether a reference only defines a key or a resource (not a place in the navigation). */
function resourceOnly(el: ElementNode, tokensOf: TokensOf): boolean {
    return tokensOf(el).includes('mapgroup-d/keydef') || attr(el, 'processing-role') === 'resource-only';
}

function same(a: string, b: string): boolean {
    const norm = (p: string) => (process.platform === 'win32' ? path.resolve(p).toLowerCase() : path.resolve(p));
    return norm(a) === norm(b);
}

/**
 * The references to `topicPath` in a map, in document order: not key definitions, not resource-only
 * references, not the references of relationship tables (they make links, not a place).
 */
export function referencesTo(doc: Document, mapPath: string, topicPath: string, tokensOf: TokensOf): ElementNode[] {
    const out: ElementNode[] = [];
    const visit = (el: ElementNode): void => {
        if (tokensOf(el).includes('map/reltable')) {
            return;
        }
        const target = referenced(el, mapPath, tokensOf);
        if (target && !target.map && same(target.file, topicPath) && !resourceOnly(el, tokensOf)) {
            out.push(el);
        }
        for (const child of childElements(el)) {
            visit(child);
        }
    };
    const root = rootElement(doc);
    if (root) {
        visit(root);
    }
    return out;
}

/** The submaps a map references, with their reference elements, in document order. */
function submapsOf(doc: Document, mapPath: string, tokensOf: TokensOf): { file: string; el: ElementNode }[] {
    const out: { file: string; el: ElementNode }[] = [];
    const visit = (el: ElementNode): void => {
        const target = referenced(el, mapPath, tokensOf);
        if (target?.map) {
            out.push({ file: target.file, el });
        }
        for (const child of childElements(el)) {
            visit(child);
        }
    };
    const root = rootElement(doc);
    if (root) {
        visit(root);
    }
    return out;
}

/**
 * The places where the maps of the workspace (`maps`: path → parsed map) reference
 * `topicPath`, reached from each root map through its submaps. `preferredRoot` (the project's
 * root map setting) comes first; then roots by path.
 */
export function findPlaces(topicPath: string, maps: ReadonlyMap<string, Document>, tokensOf: TokensOf, preferredRoot?: string): MapPlace[] {
    const known = (file: string): string | undefined => [...maps.keys()].find((k) => same(k, file));
    const edges = new Map<string, { file: string; el: ElementNode }[]>();
    const referencedMaps = new Set<string>();
    for (const [file, doc] of maps) {
        const subs = submapsOf(doc, file, tokensOf).map((s) => ({ ...s, file: known(s.file) ?? s.file })).filter((s) => maps.has(s.file));
        edges.set(file, subs);
        for (const s of subs) {
            if (!same(s.file, file)) {
                referencedMaps.add(s.file);
            }
        }
    }
    let roots = [...maps.keys()].filter((file) => !referencedMaps.has(file));
    if (roots.length === 0) {
        roots = [...maps.keys()]; // every map referenced by another (a cycle): each may be a root
    }
    roots.sort((a, b) => (preferredRoot && same(a, preferredRoot) ? -1 : preferredRoot && same(b, preferredRoot) ? 1 : a.localeCompare(b)));

    const places: MapPlace[] = [];
    const visit = (file: string, chain: ElementNode[], trailMaps: string[], root: string): void => {
        const doc = maps.get(file);
        if (!doc || trailMaps.length > 12) {
            return;
        }
        referencesTo(doc, file, topicPath, tokensOf).forEach((el, occurrence) => {
            places.push({ root, maps: trailMaps, occurrence, info: placeInfo([...chain, ...ancestry(el)], tokensOf) });
        });
        for (const sub of edges.get(file) ?? []) {
            if (!trailMaps.some((m) => same(m, sub.file))) {
                visit(sub.file, [...chain, ...ancestry(sub.el)], [...trailMaps, sub.file], root);
            }
        }
    };
    for (const root of roots) {
        visit(root, [], [root], root);
    }
    return places;
}

/** What a place says about the topic, from the chain of elements above the reference (the reference last). */
export function placeInfo(chain: ElementNode[], tokensOf: TokensOf): PlaceInfo {
    const trail: string[] = [];
    const scopes: string[] = [];
    const inherited: Record<string, string> = {};
    chain.forEach((el, k) => {
        const tokens = tokensOf(el);
        if (k === 0 && tokens.includes('map/map')) {
            const title = mapTitle(el, tokensOf);
            if (title) {
                trail.push(title);
            }
        } else if (k < chain.length - 1 && tokens.includes('map/topicref') && !tokens.includes('map/map')) {
            const label = navtitle(el, tokensOf);
            if (label) {
                trail.push(label);
            }
        }
        const keyscope = attr(el, 'keyscope');
        const first = keyscope ? decodeXmlText(keyscope).trim().split(/\s+/)[0] : '';
        if (first) {
            scopes.push(first);
        }
        // DITA's cascading: merged values from the root down; "nomerge" replaces them.
        const replace = attr(el, 'cascade') === 'nomerge';
        for (const a of el.attrs) {
            const name = a.name;
            const lower = name.toLowerCase();
            if (NOT_INHERITED.has(lower) || name.startsWith('xmlns')) {
                continue;
            }
            const value = decodeXmlText(a.value).trim();
            if (NEAREST.has(lower)) {
                inherited[name] = value;
            } else if (value) {
                const before = replace ? [] : (inherited[name] ?? '').split(/\s+/).filter(Boolean);
                inherited[name] = [...new Set([...before, ...value.split(/\s+/)])].join(' ');
            }
        }
    });
    return { trail, scope: scopes.join('.'), inherited };
}

/** A map's title: its `<title>` (a bookmap's main title), else its `@title`. */
function mapTitle(root: ElementNode, tokensOf: TokensOf): string | undefined {
    const title = childElements(root).find((c) => c.name === 'title' || c.name === 'booktitle' || tokensOf(c).includes('topic/title'));
    if (title) {
        const main = childElements(title).find((c) => c.name === 'mainbooktitle' || tokensOf(c).includes('bookmap/mainbooktitle'));
        const text = plain(main ?? title);
        if (text) {
            return text;
        }
    }
    const attribute = attr(root, 'title');
    return attribute ? decodeXmlText(attribute).trim() || undefined : undefined;
}

/** A reference's navigation title: its `<topicmeta>/<navtitle>`, else its `@navtitle`. */
function navtitle(el: ElementNode, tokensOf: TokensOf): string | undefined {
    const meta = childElements(el).find((c) => tokensOf(c).includes('map/topicmeta'));
    const nav = meta ? childElements(meta).find((c) => c.name === 'navtitle' || tokensOf(c).includes('topic/navtitle')) : undefined;
    const text = nav ? plain(nav) : decodeXmlText(attr(el, 'navtitle') ?? '').trim();
    return text || undefined;
}

/** Which reference to `topicPath` in a map the element starting at `offset` is, if it is one. */
export function occurrenceAt(doc: Document, mapPath: string, topicPath: string, offset: number, tokensOf: TokensOf): number | undefined {
    const index = referencesTo(doc, mapPath, topicPath, tokensOf).findIndex((el) => el.range.start === offset);
    return index === -1 ? undefined : index;
}

/** The same place in a fresh list (its root, maps and occurrence), if it is still there. */
export function samePlace(places: readonly MapPlace[], place: { root: string; maps: readonly string[]; occurrence: number }): MapPlace | undefined {
    return places.find((p) => same(p.root, place.root) && p.occurrence === place.occurrence
        && p.maps.length === place.maps.length && p.maps.every((m, k) => same(m, place.maps[k])));
}

/** A place in a few words: its trail, or the map's file name. */
export function placeLabel(place: MapPlace): string {
    return place.info.trail.length > 0 ? place.info.trail.join(' › ') : path.basename(place.root);
}

