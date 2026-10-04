/**
 * Images on the visual editor's page: inserting one (from a file the host lets the author
 * pick, a pasted screenshot it saves, or files dropped on the page), replacing its file and
 * setting its alternative text.
 *
 * Three placements, offered where the DTD allows them:
 * - `inline`: in the text at the cursor (`<image href="…"/>`);
 * - `break`: on its own line (`placement="break"`): instead of the empty paragraph at the
 *   cursor, else in the paragraph at the cursor, else after the current block;
 * - `figure`: in a new `<fig>` with an empty title for the caption, after the current block
 *   (or instead of the empty paragraph at the cursor).
 *
 * A selected image can be resized by dragging its corner (webview/editor/imageResize.ts): its
 * `@width`/`@height` scale together, in their units (resizedImageSize).
 *
 * Images are kept as written on the page (atoms). A new one carries its source (`attrs.raw`:
 * its `<alt>` child), which the writer writes as it is, its start tag following attribute
 * changes made later (Properties).
 *
 * Environment-neutral.
 */

import { Fragment, type Node as PMNode, type NodeType } from 'prosemirror-model';
import { type Command, type EditorState, NodeSelection, Selection, TextSelection } from 'prosemirror-state';
import { withAttribute, type AttributePairs } from '../cst/openTag';
import { parse } from '../cst/parse';
import { rootElement } from '../cst/query';
import { escapeAttr, escapeText } from '../cst/serialize';
import { isElement, type ElementNode } from '../cst/types';
import { formatLength, parseLength } from './columnWidths';
import type { DitaCommands } from './commands';
import type { EditorSchema } from './schema';

export type ImagePlacement = 'inline' | 'break' | 'figure';

export interface ImageSpec {
    /** The image's URI reference, relative to the topic. */
    href: string;
    /** Alternative text ('' or undefined: none). */
    alt?: string;
}

const FRESH = { src: null, xml: [], view: null };

/** Where a block goes: a range to replace (an empty paragraph) or an insertion point (from = to). */
interface BlockTarget {
    from: number;
    to: number;
}

export const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'tif', 'tiff'];

export function isImagePath(path: string): boolean {
    const m = /\.([A-Za-z0-9]+)(?:[?#].*)?$/.exec(path);
    return m !== null && IMAGE_EXTENSIONS.includes(m[1].toLowerCase());
}

/**
 * URIs of files dropped on the page, from the drag data: `text/uri-list` (browsers, the OS),
 * and the JSON lists VS Code's own views put (`application/vnd.code.uri-list`, `resourceurls`).
 */
export function droppedUris(get: (type: string) => string): string[] {
    const out: string[] = [];
    const add = (uri: string): void => {
        const u = uri.trim();
        if (u && !u.startsWith('#') && !out.includes(u)) {
            out.push(u);
        }
    };
    for (const type of ['application/vnd.code.uri-list', 'resourceurls']) {
        try {
            const list: unknown = JSON.parse(get(type) || '[]');
            if (Array.isArray(list)) {
                list.filter((u): u is string => typeof u === 'string').forEach(add);
            }
        } catch {
            // Not that format.
        }
    }
    get('text/uri-list').split(/\r?\n/).forEach(add);
    return out;
}

export class ImageCommands {
    constructor(private readonly es: EditorSchema, private readonly cmds: DitaCommands) {}

    /** The grammar's image has an `<alt>` child (DITA 1.2 and later), else only @alt. */
    get hasAltElement(): boolean {
        return /(^|[^\w-])alt([^\w-]|$)/.test(this.es.grammar.elements.image?.content ?? '');
    }

    /** The source of a new image element, and its attributes. */
    imageSource(spec: ImageSpec, placement: ImagePlacement): { raw: string; xml: AttributePairs } {
        const xml: AttributePairs = [['href', spec.href]];
        if (placement !== 'inline') {
            xml.push(['placement', 'break']);
        }
        const alt = spec.alt?.trim() ?? '';
        if (alt && !this.hasAltElement) {
            xml.push(['alt', alt]);
        }
        const open = `<image${xml.map(([k, v]) => ` ${k}="${escapeAttr(v, '"')}"`).join('')}`;
        return { raw: alt && this.hasAltElement ? `${open}><alt>${escapeText(alt)}</alt></image>` : `${open}/>`, xml };
    }

    private imageNode(type: NodeType, spec: ImageSpec, placement: ImagePlacement): PMNode {
        const { raw, xml } = this.imageSource(spec, placement);
        const alt = spec.alt?.trim() || undefined;
        return type.create({ src: null, xml, view: { text: alt ?? '', alt }, raw });
    }

    // -- where ---------------------------------------------------------------------------------------

    private inlineOk(state: EditorState): boolean {
        const context = this.cmds.inlineContext(state);
        return context !== undefined && this.es.nodeType('image', 'inline') !== undefined && context.every((c) => this.es.allows(c, 'image'));
    }

    /** Where a new `element` block goes: instead of the empty paragraph at the cursor, else after the current block. */
    private blockTarget(state: EditorState, element: string): BlockTarget | undefined {
        const type = this.es.nodeType(element, 'block');
        if (!type) {
            return undefined;
        }
        const { $from } = state.selection;
        if ($from.parent.isTextblock && $from.parent.content.size === 0 && $from.depth >= 2 && !this.cmds.isTextrun($from.parent)) {
            const parent = $from.node(-1);
            const index = $from.index(-1);
            if (parent.canReplaceWith(index, index + 1, type) && this.cmds.allowedIn(parent, element)) {
                return { from: $from.before(), to: $from.after() };
            }
        }
        const target = this.cmds.insertionPoint($from);
        if (target && target.parent.canReplaceWith(target.index, target.index, type) && this.cmds.allowedIn(target.parent, element)) {
            return { from: target.pos, to: target.pos };
        }
        return undefined;
    }

    /** On its own line: replacing an empty paragraph, else in the paragraph at the cursor, else after the block. */
    private breakPlan(state: EditorState): { inline: true } | (BlockTarget & { inline: false }) | undefined {
        const block = this.blockTarget(state, 'image');
        if (block && block.from !== block.to) {
            return { ...block, inline: false };
        }
        if (this.inlineOk(state)) {
            return { inline: true };
        }
        return block ? { ...block, inline: false } : undefined;
    }

    private figure(): PMNode | undefined {
        const fig = this.es.nodeType('fig', 'block');
        const title = this.es.nodeType('title', 'block');
        const image = this.es.nodeType('image', 'block');
        if (!fig || !title || !image) {
            return undefined;
        }
        const content = Fragment.from([title.create(FRESH), this.imageNode(image, { href: 'x' }, 'figure')]);
        return fig.validContent(content) ? fig.create(FRESH, content) : undefined;
    }

    /** The placements possible at the cursor. */
    placements(state: EditorState): ImagePlacement[] {
        const out: ImagePlacement[] = [];
        if (this.inlineOk(state)) {
            out.push('inline');
        }
        if (this.breakPlan(state)) {
            out.push('break');
        }
        if (this.figure() && this.blockTarget(state, 'fig')) {
            out.push('figure');
        }
        return out;
    }

    // -- insert --------------------------------------------------------------------------------------

    /**
     * Insert an image. Without `spec` it is a dry run for menus (is the placement possible
     * here?). The cursor ends after the image, or in the new figure's title.
     */
    insert(placement: ImagePlacement, spec?: ImageSpec): Command {
        return (state, dispatch) => {
            const image = spec ?? { href: 'x' };
            if (placement === 'inline') {
                const type = this.es.nodeType('image', 'inline');
                if (!type || !this.inlineOk(state)) {
                    return false;
                }
                if (dispatch && spec) {
                    dispatch(state.tr.replaceSelectionWith(this.imageNode(type, image, 'inline')).scrollIntoView());
                }
                return true;
            }
            if (placement === 'break') {
                const plan = this.breakPlan(state);
                if (!plan) {
                    return false;
                }
                if (dispatch && spec) {
                    if (plan.inline) {
                        dispatch(state.tr.replaceSelectionWith(this.imageNode(this.es.nodeType('image', 'inline')!, image, 'break')).scrollIntoView());
                    } else {
                        const node = this.imageNode(this.es.nodeType('image', 'block')!, image, 'break');
                        const tr = state.tr.replaceWith(plan.from, plan.to, node);
                        tr.setSelection(Selection.near(tr.doc.resolve(plan.from + node.nodeSize), 1));
                        dispatch(tr.scrollIntoView());
                    }
                }
                return true;
            }
            const target = this.blockTarget(state, 'fig');
            const fig = this.figure();
            if (!target || !fig) {
                return false;
            }
            if (dispatch && spec) {
                const content = Fragment.from([fig.child(0), this.imageNode(this.es.nodeType('image', 'block')!, image, 'figure')]);
                const tr = state.tr.replaceWith(target.from, target.to, fig.type.create(FRESH, content));
                tr.setSelection(TextSelection.create(tr.doc, target.from + 2)); // in the title: type the caption
                dispatch(tr.scrollIntoView());
            }
            return true;
        };
    }

    // -- the selected image ----------------------------------------------------------------------------

    /** The image selected on the page (a box selected by a click or the menu). */
    selectedImage(state: EditorState): { node: PMNode; pos: number } | undefined {
        const selection = state.selection;
        if (!(selection instanceof NodeSelection)) {
            return undefined;
        }
        const element = this.es.role(selection.node.type)?.element;
        return element && this.es.facts(element)?.tokens.includes('topic/image') ? { node: selection.node, pos: selection.from } : undefined;
    }

    /** Set the selected image's size attributes (`null` removes one; absent ones stay). */
    setSize(size: ImageSize): Command {
        return (state, dispatch) => {
            const image = this.selectedImage(state);
            if (!image) {
                return false;
            }
            if (dispatch) {
                let xml = image.node.attrs.xml as AttributePairs;
                for (const name of ['width', 'height', 'scale'] as const) {
                    if (size[name] !== undefined) {
                        xml = withAttribute(xml, name, size[name]);
                    }
                }
                const tr = state.tr.setNodeMarkup(image.pos, undefined, { ...image.node.attrs, xml });
                dispatch(tr.setSelection(NodeSelection.create(tr.doc, image.pos)));
            }
            return true;
        };
    }

    /** Point the selected image at another file (a key reference gives way to the file). */
    setHref(href: string): Command {
        return (state, dispatch) => {
            const image = this.selectedImage(state);
            if (!image) {
                return false;
            }
            if (dispatch) {
                const xml = withAttribute(withAttribute(image.node.attrs.xml as AttributePairs, 'keyref', null), 'href', href);
                const tr = state.tr.setNodeMarkup(image.pos, undefined, { ...image.node.attrs, xml });
                dispatch(tr.setSelection(NodeSelection.create(tr.doc, image.pos)));
            }
            return true;
        };
    }

    /**
     * Set the selected image's alternative text; `raw` is the image's current source. With an
     * `<alt>` element its content is replaced (added, or removed for ''); else @alt.
     */
    setAlt(alt: string, raw: string | undefined): Command {
        return (state, dispatch) => {
            const image = this.selectedImage(state);
            if (!image || (this.hasAltElement && raw === undefined)) {
                return false;
            }
            if (dispatch) {
                const { node, pos } = image;
                const text = alt.trim();
                const view = { ...((node.attrs.view as Record<string, unknown> | null) ?? {}), alt: text || undefined, text };
                let tr;
                if (this.hasAltElement) {
                    const next = withAltText(raw!, text, (name) => this.es.facts(name)?.tokens.includes('topic/alt') ?? name === 'alt');
                    tr = state.tr.replaceWith(pos, pos + node.nodeSize, node.type.create({ ...node.attrs, src: null, raw: next, view }, null, node.marks));
                } else {
                    const xml = withAttribute(node.attrs.xml as AttributePairs, 'alt', text || null);
                    tr = state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, xml, view });
                }
                dispatch(tr.setSelection(NodeSelection.create(tr.doc, pos)));
            }
            return true;
        };
    }
}

/** New size attributes of an image (`null`: remove the attribute). */
export interface ImageSize {
    width?: string | null;
    height?: string | null;
    scale?: string | null;
}

/**
 * The size attributes after resizing an image shown `shown.width` × `shown.height` pixels to
 * `width` pixels wide, keeping its proportions: `@width` and `@height` scale together in their
 * own units; with neither, `@width` is set in pixels (a bare number); `@scale` goes, the size
 * being given.
 */
export function resizedImageSize(attrs: { width?: string; height?: string; scale?: string }, shown: { width: number; height: number }, width: number): ImageSize {
    const factor = width / shown.width;
    const w = parseLength(attrs.width);
    const h = parseLength(attrs.height);
    const out: ImageSize = {};
    if (w) {
        out.width = formatLength(w.px * factor, w.unit, w.bare);
    }
    if (h) {
        out.height = formatLength(h.px * factor, h.unit, h.bare);
    }
    if (!w && !h) {
        out.width = formatLength(width, 'px', true);
    }
    if (attrs.scale !== undefined) {
        out.scale = null;
    }
    return out;
}

/** `raw` (an image's source) with its `<alt>` child set to `alt` (added first, or removed when ''). */
export function withAltText(raw: string, alt: string, isAlt: (name: string) => boolean): string {
    const el = rootElement(parse(raw));
    if (!el) {
        return raw;
    }
    const text = escapeText(alt);
    const altEl = el.children.find((c): c is ElementNode => isElement(c) && isAlt(c.name));
    if (altEl) {
        if (alt === '') {
            return raw.slice(0, altEl.range.start) + raw.slice(altEl.range.end);
        }
        if (!altEl.closeTagRange) {
            return `${raw.slice(0, altEl.range.start)}<${altEl.name}>${text}</${altEl.name}>${raw.slice(altEl.range.end)}`;
        }
        return raw.slice(0, altEl.openTagRange.end) + text + raw.slice(altEl.closeTagRange.start);
    }
    if (alt === '') {
        return raw;
    }
    if (el.selfClosing) {
        const open = raw.slice(el.openTagRange.start, el.openTagRange.end).replace(/\s*\/>$/, '>');
        return `${raw.slice(0, el.openTagRange.start)}${open}<alt>${text}</alt></${el.name}>${raw.slice(el.range.end)}`;
    }
    return `${raw.slice(0, el.openTagRange.end)}<alt>${text}</alt>${raw.slice(el.openTagRange.end)}`;
}
