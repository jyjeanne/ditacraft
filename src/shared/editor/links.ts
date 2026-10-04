/**
 * Links on the visual editor's page: the target of the cross-reference (`<xref>`) at the
 * cursor, changing it, inserting a new link, removing one.
 *
 * The host's picker chooses the target (this topic's elements, the keys, the topics of the
 * workspace, a web address); these commands put it in the document:
 * - on a link (the cursor in its text, or a link box selected): its target attributes change
 *   (`href` or `keyref`, `scope`, `format`), the others stay;
 * - with text selected in a paragraph: the text becomes the link's text;
 * - otherwise: an empty `<xref/>` at the cursor — its text is the target's title when
 *   published, which stays right when the title changes.
 *
 * Elements are recognized by class (`topic/xref`), so specializations work too.
 *
 * Environment-neutral.
 */

import { Fragment, type Node as PMNode } from 'prosemirror-model';
import { type Command, type EditorState, NodeSelection, Selection, TextSelection } from 'prosemirror-state';
import { withAttribute, type AttributePairs } from '../cst/openTag';
import { escapeAttr } from '../cst/serialize';
import { commonMarks, withoutMarks, type DitaCommands } from './commands';
import type { EditorSchema } from './schema';

/** Where a link points: a file/element/web reference, or a key. */
export interface LinkTarget {
    href?: string;
    keyref?: string;
    scope?: string;
    format?: string;
    /** The target's title, shown on the page for an empty link. */
    title?: string;
}

const FRESH = { src: null, xml: [], view: null };
const TARGET_ATTRIBUTES = ['keyref', 'href', 'scope', 'format'] as const;

/** `xml` with the target attributes of `target` (the others kept, in place). */
export function linkAttributes(xml: AttributePairs, target: LinkTarget): AttributePairs {
    let out = xml;
    for (const name of TARGET_ATTRIBUTES) {
        out = withAttribute(out, name, target[name] ?? null);
    }
    return out;
}

export class LinkCommands {
    constructor(private readonly es: EditorSchema, private readonly cmds: DitaCommands) {}

    private isLink(node: PMNode): boolean {
        const element = this.es.role(node.type)?.element;
        return element !== null && element !== undefined && (this.es.facts(element)?.tokens.includes('topic/xref') ?? false);
    }

    /** The link at the cursor: a selected link box, or the link whose text holds the cursor. */
    linkAt(state: EditorState): { node: PMNode; pos: number } | undefined {
        const selection = state.selection;
        if (selection instanceof NodeSelection) {
            return this.isLink(selection.node) ? { node: selection.node, pos: selection.from } : undefined;
        }
        const $from = selection.$from;
        for (let d = $from.depth; d > 0; d--) {
            if (this.isLink($from.node(d))) {
                return { node: $from.node(d), pos: $from.before(d) };
            }
        }
        return undefined;
    }

    /** The target of the link at the cursor. */
    current(state: EditorState): LinkTarget | undefined {
        const link = this.linkAt(state);
        if (!link) {
            return undefined;
        }
        const xml = (link.node.attrs.xml as AttributePairs | undefined) ?? [];
        const get = (name: string) => xml.find(([n]) => n === name)?.[1];
        return { href: get('href'), keyref: get('keyref'), scope: get('scope'), format: get('format') };
    }

    /** A new link can go at the cursor (the DTD allows `xref` there and in the formatting around it). */
    canInsert(state: EditorState): boolean {
        const context = this.cmds.inlineContext(state);
        return context !== undefined && context.every((c) => this.es.allows(c, 'xref')) && this.es.nodeType('xref', 'inline') !== undefined;
    }

    /** Point the link at the cursor at `target`, or insert a new link to it. Without a target: a dry run (menus). */
    setLink(target?: LinkTarget): Command {
        return (state, dispatch) => {
            const link = this.linkAt(state);
            if (link) {
                if (dispatch && target) {
                    const { node, pos } = link;
                    const xml = linkAttributes(node.attrs.xml as AttributePairs, target);
                    const view = node.isAtom ? { ...((node.attrs.view as Record<string, unknown> | null) ?? {}), text: target.title ?? target.href ?? `[${target.keyref}]` } : node.attrs.view;
                    const tr = state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, xml, view });
                    if (node.isAtom) {
                        tr.setSelection(NodeSelection.create(tr.doc, pos));
                    }
                    dispatch(tr.scrollIntoView());
                }
                return true;
            }
            if (!this.canInsert(state)) {
                return false;
            }
            const { from, to, empty, $from } = state.selection;
            if (!empty && !this.es.allowsText('xref')) {
                return false;
            }
            if (dispatch && target) {
                const xml = linkAttributes([], target);
                let node: PMNode;
                if (empty) {
                    // An empty link: kept as written on the page, showing its target's title.
                    const type = this.es.nodeType('xref', 'inline', 'opaque')!;
                    const raw = `<xref${xml.map(([k, v]) => ` ${k}="${escapeAttr(v, '"')}"`).join('')}/>`;
                    node = type.create({ src: null, xml, view: { text: target.title ?? target.href ?? `[${target.keyref}]` }, raw }, null, state.storedMarks ?? $from.marks());
                } else {
                    // The selected text is the link's text; formatting over all of it stays outside.
                    const content = state.doc.slice(from, to).content;
                    const marks = commonMarks(content);
                    node = this.es.nodeType('xref', 'inline')!.create({ ...FRESH, xml }, withoutMarks(content, marks), marks);
                }
                const tr = state.tr.replaceWith(from, to, node);
                tr.setSelection(TextSelection.create(tr.doc, from + node.nodeSize));
                dispatch(tr.scrollIntoView());
            }
            return true;
        };
    }

    /** Remove the link at the cursor: its text stays (an empty link goes). */
    readonly removeLink: Command = (state, dispatch) => {
        const link = this.linkAt(state);
        if (!link) {
            return false;
        }
        if (dispatch) {
            const { node, pos } = link;
            const children: PMNode[] = [];
            node.content.forEach((c) => children.push(c.mark(node.marks.reduce((set, m) => m.addToSet(set), c.marks))));
            const tr = state.tr.replaceWith(pos, pos + node.nodeSize, Fragment.from(children));
            tr.setSelection(Selection.near(tr.doc.resolve(Math.min(pos + Fragment.from(children).size, tr.doc.content.size))));
            dispatch(tr.scrollIntoView());
        }
        return true;
    };
}
