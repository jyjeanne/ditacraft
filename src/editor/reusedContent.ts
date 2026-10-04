/**
 * What the visual editor's boxes show for a topic's references, resolved as the preview
 * resolves them:
 * - reuse (`conref`, `conkeyref`; not pushes): the reused element rendered by the preview's
 *   renderer, with nested reuse, keys and images resolved;
 * - keys (`keyref`): the key's text for an empty phrase or link, the glossary term for a
 *   `<term>`, the file for an `<image>`;
 * - empty links (`<xref href="…"/>`): the title of their target;
 * - in a map, each row (`topicref` and its specializations, `navref`): the title of its topic
 *   or map (spec §13.8);
 * or why each cannot be resolved.
 *
 * No `vscode` import: unit-tested with plain Mocha.
 */

import * as path from 'path';
import { attr, walk } from '../shared/cst/query';
import { isElement, type Document, type ElementNode } from '../shared/cst/types';
import type { ResolvedItem } from '../shared/editor/reused';
import { renderElement } from '../shared/render/toHtml';
import type { RenderOptions, Resolution } from '../shared/render/types';
import type { ReferenceResolver } from '../preview/resolver';

/**
 * Items for the references of `doc`, from a resolution pass of `resolver` over it. `imageUrl`
 * turns an image file a key gives into a URL the page can load (undefined: it cannot).
 */
export function resolvedItems(doc: Document, resolver: ReferenceResolver, resolutions: ReadonlyMap<ElementNode, Resolution>, options: RenderOptions,
    imageUrl: (absolutePath: string) => string | undefined): ResolvedItem[] {
    const items: ResolvedItem[] = [];
    for (const request of resolver.collect(doc)) {
        const res = resolutions.get(request.el);
        if (!res) {
            continue;
        }
        const offset = request.el.range.start;
        if (request.kind === 'reuse') {
            if (res.unresolved) {
                items.push({ offset, kind: 'reuse', error: res.unresolved, from: res.from });
                continue;
            }
            try {
                items.push({ offset, kind: 'reuse', html: renderElement(doc, request.el, { ...options, resolutions }), from: res.from });
            } catch (error) {
                items.push({ offset, kind: 'reuse', error: error instanceof Error ? error.message : String(error), from: res.from });
            }
        } else if (request.kind === 'keyref') {
            const from = res.key;
            if (res.unresolved) {
                items.push({ offset, kind: 'key', error: res.unresolved, from });
            } else if (resolver.tokens(request.el).includes('topic/image')) {
                const src = res.path ? imageUrl(res.path) : undefined;
                if (src) {
                    items.push({ offset, kind: 'key', src, from: `${from} → ${path.basename(res.path!)}` });
                }
            } else if (res.text) {
                items.push({ offset, kind: 'key', text: res.text, from });
            }
        } else if (request.kind === 'href') {
            const from = res.path ? `${path.basename(res.path)}${res.fragment ? `#${res.fragment}` : ''}` : undefined;
            if (res.unresolved) {
                items.push({ offset, kind: 'link', error: res.unresolved, from });
            } else if (res.text) {
                items.push({ offset, kind: 'link', text: res.text, from });
            }
        }
    }
    return items;
}

/**
 * Items for the rows of a map: what each reference's target is called (or why it cannot be
 * read). Reused rows (`conref`) are reuse boxes, left out. Files read go to `deps`.
 */
export async function mapRowItems(doc: Document, resolver: ReferenceResolver, docPath: string, deps: Set<string>): Promise<ResolvedItem[]> {
    const rows: ElementNode[] = [];
    for (const node of walk(doc.children)) {
        if (!isElement(node) || attr(node, 'conref') !== undefined || attr(node, 'conkeyref') !== undefined) {
            continue;
        }
        const tokens = resolver.tokens(node);
        if (tokens.includes('map/topicref') || tokens.includes('map/navref')) {
            rows.push(node);
        }
    }
    const items = await Promise.all(rows.map(async (el): Promise<ResolvedItem | undefined> => {
        let res: Resolution | undefined;
        try {
            res = await resolver.resolveMapReference(el, docPath, deps);
        } catch (error) {
            return { offset: el.range.start, kind: 'row', error: error instanceof Error ? error.message : String(error) };
        }
        if (!res) {
            return undefined;
        }
        const file = res.path ? `${path.basename(res.path)}${res.fragment ? `#${res.fragment}` : ''}` : undefined;
        const from = res.key ? (file ? `${res.key} → ${file}` : res.key) : file;
        return res.unresolved !== undefined
            ? { offset: el.range.start, kind: 'row', error: res.unresolved, from }
            : res.text ? { offset: el.range.start, kind: 'row', text: res.text, from } : undefined;
    }));
    return items.filter((item): item is ResolvedItem => item !== undefined);
}
