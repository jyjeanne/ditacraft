/**
 * The elements the visual editor's page keeps whole, with what their references resolve to:
 * - reuse boxes (spec §13.7): the reference, then the reused content itself as the preview
 *   renders it — read only (it is edited where it comes from: Open source; or made local:
 *   Replace with copy);
 * - an empty phrase or link given by a key or pointing to a topic: the key's text or the
 *   target's title, instead of `[key]` or the href; an image given by a key: its file.
 *
 * What a reference resolves to comes from the host (src/editor/reusedContent.ts) and reaches
 * an element through a node decoration whose spec carries it (`resolved`), so a new resolution
 * redraws only the elements it changes.
 */

import { DOMSerializer, type Node as PMNode } from 'prosemirror-model';
import type { Decoration, NodeView, NodeViewConstructor } from 'prosemirror-view';
import { isReuseNode, type ResolvedItem } from '../../src/shared/editor/reused';
import type { EditorSchema } from '../../src/shared/editor/schema';

/** The item an element's decorations carry. */
export function resolvedItemOf(decorations: readonly Decoration[]): ResolvedItem | undefined {
    for (const d of decorations) {
        const item = (d.spec as { resolved?: ResolvedItem }).resolved;
        if (item) {
            return item;
        }
    }
    return undefined;
}

/** An element kept whole other than a reuse box: drawn by its node type, with what its reference resolves to. */
class KeptView implements NodeView {
    readonly dom: HTMLElement;
    private readonly shown: string;

    constructor(private readonly node: PMNode, decorations: readonly Decoration[]) {
        const item = resolvedItemOf(decorations);
        this.shown = JSON.stringify(item ?? null);
        let drawn = node;
        if (item && (item.text !== undefined || item.src !== undefined)) {
            const view = { ...((node.attrs.view as Record<string, unknown> | null) ?? {}), ...(item.text !== undefined ? { text: item.text } : {}), ...(item.src ? { src: item.src } : {}) };
            drawn = node.type.create({ ...node.attrs, view }, null, node.marks);
        }
        this.dom = DOMSerializer.renderSpec(document, node.type.spec.toDOM!(drawn)).dom as HTMLElement;
        if (item) {
            this.dom.classList.add(item.error !== undefined ? 'dc-unresolved' : 'dc-resolved');
            // What it is (an image's alt text, else the element) and where it comes from.
            const what = this.dom.getAttribute('alt') || this.dom.dataset.dita || '';
            this.dom.title = item.error !== undefined ? `⚠ ${item.error}` : item.from ? `${what} — ${item.from}` : this.dom.title;
        }
    }

    /** Redrawn (false) when the element or what it resolves to changes. */
    update(node: PMNode, decorations: readonly Decoration[]): boolean {
        return node.type === this.node.type && node.sameMarkup(this.node) && JSON.stringify(resolvedItemOf(decorations) ?? null) === this.shown;
    }
}

export class ReusedView implements NodeView {
    readonly dom: HTMLElement;
    private readonly source: HTMLElement;
    private readonly body: HTMLElement;
    private shown = '';

    constructor(private node: PMNode, private readonly element: string, decorations: readonly Decoration[]) {
        const inline = node.isInline;
        this.dom = document.createElement(inline ? 'span' : 'div');
        this.dom.className = `dc-opaque dc-conref dc-reuse${inline ? ' dc-reuse-inline' : ''}`;
        this.dom.dataset.dita = element;
        this.source = Object.assign(document.createElement('span'), { className: 'dc-reuse-source' });
        this.body = document.createElement(inline ? 'span' : 'div');
        this.body.className = 'dc-reuse-content';
        this.dom.append(this.source, this.body);
        // Links inside reused content are shown, not followed (Open source goes to the source).
        this.dom.addEventListener('click', (e) => {
            if ((e.target as Element | null)?.closest('a')) {
                e.preventDefault();
            }
        });
        this.render(decorations);
    }

    private render(decorations: readonly Decoration[]): void {
        const xml = this.node.attrs.xml as [string, string][];
        const reference = xml.find(([n]) => n === 'conkeyref')?.[1] ?? xml.find(([n]) => n === 'conref')?.[1] ?? '';
        const item = resolvedItemOf(decorations);
        const key = JSON.stringify([reference, item?.html, item?.error]);
        if (key === this.shown) {
            return;
        }
        this.shown = key;
        this.source.textContent = `↪ ${reference}`;
        this.dom.title = item?.from ? `${this.element} ↪ ${item.from}` : `${this.element} ↪ ${reference}`;
        this.dom.classList.toggle('dc-reuse-unresolved', item?.error !== undefined);
        if (item?.html !== undefined) {
            // DitaCraft's own renderer output (escaped text, sanitized foreign content), as on the preview page.
            this.body.innerHTML = item.html;
        } else {
            this.body.textContent = item?.error ? `⚠ ${item.error}` : '';
        }
    }

    update(node: PMNode, decorations: readonly Decoration[]): boolean {
        if (node.type !== this.node.type || !isReuseNode(node)) {
            return false;
        }
        this.node = node;
        this.render(decorations);
        return true;
    }

    /** The reused content is not part of the editable document. */
    ignoreMutation(): boolean {
        return true;
    }
}

/** Node views for the element types kept as written: reuse boxes show their content; the others what their references resolve to. */
export function resolvedNodeViews(es: EditorSchema): Record<string, NodeViewConstructor> {
    const out: Record<string, NodeViewConstructor> = {};
    for (const type of Object.values(es.schema.nodes)) {
        const role = es.role(type);
        const element = role?.element;
        if (role?.kind !== 'opaque' || !element) {
            continue;
        }
        out[type.name] = (node, _view, _getPos, decorations) => (isReuseNode(node) ? new ReusedView(node, element, decorations) : new KeptView(node, decorations));
    }
    return out;
}
