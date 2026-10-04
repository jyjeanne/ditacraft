/**
 * Link targets for the visual editor's link picker: the elements a link can point to in a
 * topic (the topics, and their elements with an @id), the picker's items, and the link a
 * choice makes.
 *
 * No `vscode` import: unit-tested with plain Mocha.
 */

import * as path from 'path';
import { attr, childElements, rawTextContent, rootElement, walk } from '../shared/cst/query';
import type { Document, ElementNode } from '../shared/cst/types';
import { isElement } from '../shared/cst/types';
import { decodeXmlText } from '../shared/render/html';
import type { LinkTarget } from '../shared/editor/links';
import { hrefFor } from './imageFiles';

/** An element a link can point to inside a topic file. */
export interface DocTarget {
    /** The topic's id, and the element's (none: the topic itself). */
    topicId: string;
    elemId?: string;
    /** Element name, and its title or first words. */
    name: string;
    title: string;
    /** Nesting depth (topics in topics), for indentation. */
    depth: number;
}

/** A topic or map file of the workspace. */
export interface FileTarget {
    path: string;
    title: string;
    map: boolean;
}

export interface KeyTarget {
    key: string;
    /** The key's text or title (navtitle, keyword), and the file it points to. */
    title?: string;
    targetFile?: string;
}

/** One picker item: its label and description, and what choosing it does. */
export interface PickItem {
    id: string;
    label: string;
    description?: string;
    detail?: string;
    /** A separator above (its label). */
    section?: string;
    /** The link it makes; undefined: a further step (a web address, a topic's elements). */
    target?: LinkTarget;
}

type TokensOf = (el: ElementNode) => string[];

function plainText(el: ElementNode): string {
    return decodeXmlText(rawTextContent(el)).replace(/\s+/g, ' ').trim();
}

/** An element's title (its title child), else its first words. */
export function titleOf(el: ElementNode, tokensOf: TokensOf): string {
    const title = childElements(el).find((c) => c.name === 'title' || tokensOf(c).includes('topic/title'));
    const text = title ? plainText(title) : plainText(el);
    return text.length > 80 ? `${text.slice(0, 79)}…` : text;
}

/** Topics and elements with an @id in a document, in document order. */
export function targetsInDocument(doc: Document, tokensOf: TokensOf): DocTarget[] {
    const out: DocTarget[] = [];
    const visit = (el: ElementNode, topicId: string | undefined, depth: number): void => {
        const id = attr(el, 'id');
        const isTopic = tokensOf(el).includes('topic/topic');
        let topic = topicId;
        let nextDepth = depth;
        if (isTopic && id) {
            topic = id;
            nextDepth = depth + 1;
            out.push({ topicId: id, name: el.name, title: titleOf(el, tokensOf), depth });
        } else if (id && topic && !tokensOf(el).includes('topic/title')) {
            out.push({ topicId: topic, elemId: id, name: el.name, title: titleOf(el, tokensOf), depth });
        }
        for (const child of el.children) {
            if (isElement(child)) {
                visit(child, topic, nextDepth);
            }
        }
    };
    const root = rootElement(doc);
    if (root) {
        visit(root, undefined, 0);
    }
    return out;
}

/** The title and kind of a topic or map file (null when it is neither). */
export function fileSummary(doc: Document, tokensOf: TokensOf): { title: string; map: boolean } | null {
    const root = rootElement(doc);
    if (!root) {
        return null;
    }
    const map = tokensOf(root).includes('map/map');
    if (!map && root.name !== 'dita' && !tokensOf(root).includes('topic/topic')) {
        return null;
    }
    const first = root.name === 'dita' ? [...walk(root.children)].find((n): n is ElementNode => isElement(n) && tokensOf(n).includes('topic/topic')) : root;
    const title = first ? titleOf(first, tokensOf) : '';
    return { title: title || attr(root, 'title') || '', map };
}

export function fragment(t: DocTarget): string {
    return t.elemId ? `${t.topicId}/${t.elemId}` : t.topicId;
}

/** A same-document link (`#topic/element`). */
export function docLink(t: DocTarget): LinkTarget {
    return { href: `#${fragment(t)}`, title: t.title };
}

/** A link to a file, or to one of its topics or elements. */
export function fileLink(fromDoc: string, file: FileTarget, t?: DocTarget): LinkTarget {
    const href = hrefFor(fromDoc, file.path) + (t ? `#${fragment(t)}` : '');
    return { href, format: file.map ? 'ditamap' : undefined, title: t?.title ?? file.title };
}

/** A link to an address on the web (or mail); undefined when it is not one. */
export function webLink(address: string): LinkTarget | undefined {
    const a = address.trim();
    if (!/^(https?:\/\/\S+|mailto:\S+@\S+)$/i.test(a)) {
        return undefined;
    }
    return { href: a, scope: 'external', format: /^mailto:/i.test(a) ? undefined : 'html', title: a };
}

export interface PickLabels {
    web: string;
    thisTopic: string;
    keys: string;
    topics: string;
}

/**
 * The first step's items: a web address, this topic's elements, the keys, the other topics.
 * `wholeFiles` (a map's references): a topic is chosen as a whole, with no second step.
 */
export function pickItems(docPath: string, here: DocTarget[], keys: KeyTarget[], files: FileTarget[], labels: PickLabels, wholeFiles = false): PickItem[] {
    const items: PickItem[] = [{ id: 'web', label: `$(globe) ${labels.web}` }];
    here.forEach((t, k) => items.push({
        id: `doc:${fragment(t)}`, label: `${'  '.repeat(t.depth)}${t.title || `<${t.name}>`}`, description: `<${t.name}> #${fragment(t)}`,
        section: k === 0 ? labels.thisTopic : undefined, target: docLink(t),
    }));
    [...keys].sort((a, b) => a.key.localeCompare(b.key)).forEach((k, i) => items.push({
        id: `key:${k.key}`, label: `$(key) ${k.key}`, description: [k.title, k.targetFile ? path.basename(k.targetFile) : undefined].filter(Boolean).join(' — '),
        section: i === 0 ? labels.keys : undefined, target: { keyref: k.key, title: k.title ?? k.key },
    }));
    const others = files.filter((f) => path.resolve(f.path) !== path.resolve(docPath))
        .sort((a, b) => a.path.localeCompare(b.path));
    others.forEach((f, i) => items.push({
        id: `file:${hrefFor(docPath, f.path)}`, label: `${f.map ? '$(list-tree)' : '$(file)'} ${f.title || path.basename(f.path)}`,
        description: hrefFor(docPath, f.path), section: i === 0 ? labels.topics : undefined,
        // A map is linked as a whole; a topic's elements are a second step (not for a map's references).
        target: f.map || wholeFiles ? fileLink(docPath, f) : undefined,
    }));
    return items;
}

/** The second step for a topic file: the topic itself, then its topics and elements. */
export function fileItems(docPath: string, file: FileTarget, targets: DocTarget[], itself: string): PickItem[] {
    return [
        { id: 'file', label: `$(file) ${itself}`, description: file.title, target: fileLink(docPath, file) },
        ...targets.map((t): PickItem => ({
            id: `el:${fragment(t)}`, label: `${'  '.repeat(t.depth)}${t.title || `<${t.name}>`}`, description: `<${t.name}> #${fragment(t)}`,
            target: fileLink(docPath, file, t),
        })),
    ];
}
