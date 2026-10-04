/**
 * "Replace with copy" (spec §13.7): the source text that replaces a reuse element (`conref`,
 * `conkeyref`) with a copy of the content it reuses, so the author can change it in place.
 *
 * The copy is what DITA's conref resolution makes of the element (DITA 1.3 §2.4.2.2): the
 * referencing element's name and attributes, plus the reused element's attributes it does
 * not set — except the reused @id; `-dita-use-conref-target` takes the reused value; the
 * conref attributes are consumed. A `conrefend` range gives every element of the range, the
 * first one resolved that way.
 *
 * The reused source is copied as written (layout, comments, entity references), except where
 * it must change to keep its meaning in its new place:
 * - relative references (`href`, `conref`, `conrefend`, `data`, `codebase`, `longdescref`)
 *   are rewritten relative to the edited file; a same-file reference (`#topic/el`) gets the
 *   reused file's name, a same-topic one (`#./el`) the reused topic's id;
 * - an @id already used where the copy lands is dropped (element ids in the topic, topic ids
 *   in the document).
 *
 * No `vscode` import: unit-tested with plain Mocha.
 */

import * as path from 'path';
import { rewriteOpenTag, type AttributePairs } from '../shared/cst/openTag';
import { attr, walk } from '../shared/cst/query';
import type { CstNode, Document, ElementNode } from '../shared/cst/types';
import { isElement } from '../shared/cst/types';
import { decodeXmlText, type EntityLookup } from '../shared/render/html';
import { samePath } from '../preview/paths';

export interface ReuseCopyInput {
    /** The edited document, its path, and the reuse element in it. */
    doc: Document;
    docPath: string;
    el: ElementNode;
    /** What it reuses — one element, or the elements of a conrefend range — in `sourceDoc`. */
    parts: ElementNode[];
    sourceDoc: Document;
    sourcePath: string;
    /** Class tokens of an element (topics are recognized by `topic/topic`). */
    tokensOf: (el: ElementNode) => string[];
    entity?: EntityLookup;
}

/** Attributes holding a URI reference relative to the file they are written in. */
const REFERENCE_ATTRIBUTES = new Set(['href', 'conref', 'conrefend', 'data', 'codebase', 'longdescref']);
/** Attributes the resolution consumes. */
const CONSUMED = new Set(['conref', 'conkeyref', 'conrefend', 'conaction']);
const USE_TARGET = '-dita-use-conref-target';

/** The copy's source text (the elements, and what lies between those of a range). */
export function reuseCopy(input: ReuseCopyInput): string {
    const { doc, el, parts, sourceDoc } = input;
    if (parts.length === 0) {
        throw new Error('nothing to copy');
    }
    const source = sourceDoc.source;
    const decode = (value: string): string => decodeXmlText(value, input.entity);
    const pairs = (e: ElementNode): AttributePairs => e.attrs.map((a) => [a.name, decode(a.value)]);
    const isTopic = (e: ElementNode): boolean => input.tokensOf(e).includes('topic/topic');
    const topicOf = (e: ElementNode | null | undefined): ElementNode | undefined => {
        for (let p = e; p; p = p.parent) {
            if (isTopic(p)) {
                return p;
            }
        }
        return undefined;
    };

    // Ids used where the copy lands: topic ids in the document, element ids in the topic
    // (the referencing element's own id stays: the copy takes it).
    const topicIds = new Set<string>();
    for (const node of walk(doc.children)) {
        const id = isElement(node) && isTopic(node) ? attr(node, 'id') : undefined;
        if (id) {
            topicIds.add(decode(id));
        }
    }
    const destination = topicOf(el.parent);
    const elementIds = new Set<string>();
    const collect = (nodes: CstNode[]): void => {
        for (const node of nodes) {
            if (!isElement(node) || node === el || (destination && isTopic(node))) {
                continue;
            }
            const id = attr(node, 'id');
            if (id) {
                elementIds.add(decode(id));
            }
            collect(node.children);
        }
    };
    collect(destination ? destination.children : doc.children);
    const ownId = attr(el, 'id');
    if (ownId) {
        elementIds.add(decode(ownId));
    }

    const sameFile = samePath(input.sourcePath, input.docPath);
    const destinationTopicId = destination ? attr(destination, 'id') : undefined;
    const edits: { start: number; end: number; text: string }[] = [];
    parts.forEach((part, k) => {
        const first = k === 0;
        for (const node of walk([part])) {
            if (!isElement(node)) {
                continue;
            }
            const old = pairs(node);
            // The topic this element is in once copied: a copied topic, or the destination.
            const copiedTopic = topicOf(node);
            const insideCopy = copiedTopic !== undefined && isWithin(copiedTopic, part);
            const sourceTopicId = copiedTopic ? attr(copiedTopic, 'id') : undefined;
            const sameTopic = sameFile && !insideCopy && sourceTopicId !== undefined && sourceTopicId === destinationTopicId;
            let xml: AttributePairs = old.map(([name, value]) => [name, REFERENCE_ATTRIBUTES.has(name)
                ? rebase(value, input.sourcePath, input.docPath, sameFile, insideCopy || sameTopic ? undefined : sourceTopicId && decode(sourceTopicId))
                : value]);
            let name: string | undefined;
            if (first && node === part) {
                xml = resolvedAttributes(pairs(el), xml);
                name = el.name;
            } else {
                const id = xml.find(([n]) => n === 'id')?.[1];
                // Element ids inside a copied topic are that topic's own: nothing to compare.
                const scope = isTopic(node) ? topicIds : insideCopy ? undefined : elementIds;
                if (id !== undefined && scope) {
                    if (scope.has(id)) {
                        xml = xml.filter(([n]) => n !== 'id');
                    } else {
                        scope.add(id);
                    }
                }
            }
            const renamed = name !== undefined && name !== node.name;
            if (renamed || !sameAttributes(old, xml)) {
                edits.push({ start: node.openTagRange.start, end: node.openTagRange.end, text: rewriteOpenTag(source, node, old, xml, name) });
                if (renamed && node.closeTagRange) {
                    edits.push({ start: node.closeTagRange.start, end: node.closeTagRange.end, text: `</${name}>` });
                }
            }
        }
    });
    const start = parts[0].range.start;
    const end = parts[parts.length - 1].range.end;
    let out = source.slice(start, end);
    for (const e of edits.sort((a, b) => b.start - a.start)) {
        out = out.slice(0, e.start - start) + e.text + out.slice(e.end - start);
    }
    return out;
}

/** The resolved element's attributes: the referencing element's, then the reused one's (DITA 1.3 §2.4.2.2). */
export function resolvedAttributes(referencing: AttributePairs, reused: AttributePairs): AttributePairs {
    const out: AttributePairs = referencing.filter(([name, value]) => !CONSUMED.has(name) && value !== USE_TARGET);
    for (const [name, value] of reused) {
        if (name === 'id' || name === 'class' || CONSUMED.has(name) || value === USE_TARGET || out.some(([n]) => n === name)) {
            continue;
        }
        out.push([name, value]);
    }
    return out;
}

/**
 * A URI reference written in `from`, rewritten to mean the same in `to`. `sourceTopicId`:
 * the topic a same-topic reference (`#./el`) meant, when it must be named.
 */
export function rebase(value: string, from: string, to: string, sameFile: boolean, sourceTopicId: string | undefined): string {
    const v = value.trim();
    // A URI scheme has 2+ characters (C:\… is a Windows path); absolute paths stay.
    if (v === '' || /^[a-z][\w+.-]+:/i.test(v) || path.isAbsolute(v) || v.startsWith('/')) {
        return value;
    }
    const hash = v.indexOf('#');
    const file = hash === -1 ? v : v.slice(0, hash);
    const fragment = hash === -1 ? undefined : v.slice(hash + 1);
    if (file === '') {
        if (fragment?.startsWith('./')) {
            if (!sourceTopicId) {
                return value; // the same topic as before
            }
            return `${sameFile ? '' : uriPath(path.relative(path.dirname(to), from))}#${sourceTopicId}/${fragment.slice(2)}`;
        }
        return sameFile ? value : `${uriPath(path.relative(path.dirname(to), from))}#${fragment ?? ''}`;
    }
    if (samePath(path.dirname(from), path.dirname(to))) {
        return value;
    }
    let decoded = file;
    try {
        decoded = decodeURI(file);
    } catch {
        // Malformed escapes: use the reference as written.
    }
    const target = path.resolve(path.dirname(from), decoded);
    return uriPath(path.relative(path.dirname(to), target)) + (fragment === undefined ? '' : `#${fragment}`);
}

function uriPath(relative: string): string {
    return relative.split(path.sep).join('/').replace(/ /g, '%20');
}

function isWithin(node: ElementNode, ancestor: ElementNode): boolean {
    for (let p: ElementNode | null | undefined = node; p; p = p.parent) {
        if (p === ancestor) {
            return true;
        }
    }
    return false;
}

function sameAttributes(a: AttributePairs, b: AttributePairs): boolean {
    return a.length === b.length && a.every(([k, v], i) => b[i][0] === k && b[i][1] === v);
}
