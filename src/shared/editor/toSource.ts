/**
 * ProseMirror document → DITA source (spec §13.1 `fromProseMirror`, §12 lossless writing).
 *
 * The output is the full new source text; the caller turns it into one minimal span edit
 * (minimalEdit.ts). Losslessness comes from three rules:
 *
 * 1. A node that is the very object built at load (Base.origin) is unchanged: its source
 *    range is copied verbatim — tags, attribute layout, entities, whitespace, comments.
 * 2. A changed element that still names its source element (attrs.src) keeps its original
 *    start/end tags (unless its attributes or name changed) and its children are aligned
 *    with the children it had at load: the unchanged prefix and suffix, and everything
 *    between them in the source (layout whitespace, block-level comments), are copied;
 *    only the changed middle is written.
 * 3. In the changed middle, a text node edited in place is projected through its display
 *    → source map, so only the typed characters change (a wrapped paragraph keeps its
 *    line breaks, `&amp;` stays an entity). Other inline changes (formatting, inserted
 *    phrases) are re-written between boundaries where no highlight element is left open.
 *
 * New elements are written canonically, indented like their siblings. An element whose
 * source element is already written (a paragraph split in two) is a copy without its @id.
 *
 * Environment-neutral.
 */

import { Mark, type Node as PMNode } from 'prosemirror-model';
import { rewriteOpenTag } from '../cst/openTag';
import { parse } from '../cst/parse';
import { rootElement } from '../cst/query';
import { escapeAttr, escapeText } from '../cst/serialize';
import type { ElementNode } from '../cst/types';
import { decodeXmlText } from '../render/html';
import { CDATA_MARK, SYNTHETIC, type TypeRole } from './schema';
import type { Base, NodeOrigin, TextOrigin } from './toProseMirror';

type Pairs = [string, string][];

function sameXml(a: Pairs | undefined, b: Pairs | undefined): boolean {
    const x = a ?? [];
    const y = b ?? [];
    return x.length === y.length && x.every(([k, v], i) => y[i][0] === k && y[i][1] === v);
}

/** Write CDATA content, splitting any `]]>` across two sections. */
function cdataText(text: string): string {
    return text.replace(/]]>/g, ']]]]><![CDATA[>');
}

/** The source edit that turns a text node's old display into `next`, through its map. */
export function projectText(t: TextOrigin, next: string): { start: number; end: number; text: string } {
    const prev = t.display;
    const max = Math.min(prev.length, next.length);
    let p = 0;
    while (p < max && prev[p] === next[p]) {
        p++;
    }
    let s = 0;
    while (s < max - p && prev[prev.length - 1 - s] === next[next.length - 1 - s]) {
        s++;
    }
    const inserted = next.slice(p, next.length - s);
    return {
        start: t.map[p],
        end: t.map[prev.length - s],
        text: t.cdata ? cdataText(inserted) : escapeText(inserted),
    };
}

const rawWritten = new WeakMap<PMNode, string>();

/**
 * The source of an atom kept as written (`attrs.raw`: pasted, or copied in) with its start tag
 * following the node's attributes: a paste drops @id, the Properties pane changes others.
 */
function rawWithAttributes(node: PMNode, name: string, xml: Pairs): string {
    const raw = node.attrs.raw as string;
    let out = rawWritten.get(node);
    if (out !== undefined) {
        return out;
    }
    out = raw;
    try {
        const el = rootElement(parse(raw));
        const old: Pairs | undefined = el?.attrs.map((a) => [a.name, decodeXmlText(a.value)]);
        if (el && old && (el.name !== name || !sameXml(old, xml))) {
            out = rewriteOpenTag(raw, el, old, xml, name) + raw.slice(el.openTagRange.end, el.closeTagRange && el.name !== name ? el.closeTagRange.start : raw.length)
                + (el.closeTagRange && el.name !== name ? `</${name}>` : '');
        }
    } catch {
        // Not a single element: written as it is.
    }
    rawWritten.set(node, out);
    return out;
}

export function serializeDocument(doc: PMNode, base: Base): string {
    const root = doc.firstChild;
    if (!root) {
        return base.source;
    }
    const writer = new Writer(base);
    const start = base.root.range.start;
    return base.source.slice(0, start) + writer.node(root, writer.lineIndent(start)) + base.source.slice(base.root.range.end);
}

/** Content whose whitespace is text: a moved element holding it is not re-indented. */
const PRESERVING = /<(pre|codeblock|lines|screen|msgblock)[\s>/]|xml:space\s*=|<!\[CDATA\[/;

class Writer {
    /** Source elements already written once (a second node naming one is a copy). */
    private readonly written = new Set<string>();
    /** Source text of new text nodes while a middle is written (markOnlySources). */
    private textSource: Map<PMNode, string> | undefined;

    constructor(private readonly base: Base) {}

    private raw(start: number, end: number): string {
        return this.base.source.slice(start, end);
    }

    private origin(node: PMNode): NodeOrigin | undefined {
        return this.base.origin.get(node);
    }

    private role(node: PMNode): TypeRole | undefined {
        return node.type.spec.dita as TypeRole | undefined;
    }

    /** Whitespace indentation of the source line holding `offset`. */
    lineIndent(offset: number): string {
        const source = this.base.source;
        const lineStart = source.lastIndexOf('\n', offset - 1) + 1;
        return /^[ \t]*/.exec(source.slice(lineStart, offset))?.[0] ?? '';
    }

    // -- dispatch ----------------------------------------------------------------------------

    node(node: PMNode, indent: string): string {
        const origin = this.origin(node);
        if (origin) {
            return this.raw(origin.start, origin.end);
        }
        if (node.isText) {
            return this.newText(node);
        }
        switch (node.type.name) {
            case SYNTHETIC.textrun:
                return this.inline(this.childrenOf(node));
            case SYNTHETIC.entity:
                return `&${String(node.attrs.name)};`;
            case SYNTHETIC.comment:
                return `<!--${String(node.attrs.text)}-->`;
            case SYNTHETIC.pi:
                return `<?${String(node.attrs.text)}?>`;
            default:
                break;
        }
        const role = this.role(node);
        const name = role?.element ?? (node.attrs.name as string | undefined);
        if (!name) {
            return '';
        }
        const src = node.attrs.src as string | null;
        const old = src && !this.written.has(src) ? this.base.bySrc.get(src) : undefined;
        if (src) {
            this.written.add(src);
        }
        return old ? this.changedElement(node, old, name, indent) : this.newElement(node, name, indent, src);
    }

    private newText(node: PMNode): string {
        const text = node.text ?? '';
        return node.marks.some((m) => m.type.name === CDATA_MARK) ? `<![CDATA[${cdataText(text)}]]>` : escapeText(text);
    }

    private childrenOf(node: PMNode): PMNode[] {
        const out: PMNode[] = [];
        node.forEach((child) => out.push(child));
        return out;
    }

    // -- elements ------------------------------------------------------------------------------

    /**
     * A start tag written from attribute pairs. An attribute whose value is unchanged since
     * load (`oldXml`, decoded the same way) keeps its source text: quotes, entities.
     */
    private openTag(name: string, xml: Pairs, el: ElementNode | undefined, oldXml: Pairs | undefined, selfClosing: boolean): string {
        const parts = xml.map(([key, value]) => {
            const existing = el?.attrs.find((a) => a.name === key);
            if (existing && oldXml?.some(([k, v]) => k === key && v === value)) {
                return this.raw(existing.range.start, existing.range.end);
            }
            const quote = existing?.quote ?? '"';
            return `${key}=${quote}${escapeAttr(value, quote)}${quote}`;
        });
        return `<${name}${parts.map((p) => ` ${p}`).join('')}${selfClosing ? '/>' : '>'}`;
    }

    /** An element that names its source element (attrs.src), changed since load. */
    private changedElement(node: PMNode, old: PMNode, name: string, indent: string): string {
        const origin = this.origin(old)!;
        const el = origin.element!;
        const sameName = el.name === name;
        const sameAttrs = sameXml(node.attrs.xml as Pairs, old.attrs.xml as Pairs);
        const ownIndent = this.lineIndent(el.range.start) || indent;
        // Attribute changes are made in place in the original start tag (layout kept).
        const open = sameName && sameAttrs
            ? this.raw(el.openTagRange.start, el.openTagRange.end)
            : rewriteOpenTag(this.base.source, el, old.attrs.xml as Pairs, node.attrs.xml as Pairs, sameName ? undefined : name);
        const close = sameName && el.closeTagRange ? this.raw(el.closeTagRange.start, el.closeTagRange.end) : `</${name}>`;
        if (node.isAtom) {
            // Content is not represented in the editor: keep it as it was.
            return el.selfClosing ? open : open + this.raw(origin.contentStart, origin.contentEnd) + close;
        }
        const inner = this.children(old, node, origin.contentStart, origin.contentEnd, ownIndent);
        // The last child gone (a row moved out), only layout left: written empty, as below.
        const emptied = old.childCount > 0 && node.childCount === 0 && !node.inlineContent && inner.trim() === '';
        if (inner === '' || emptied) {
            if (el.selfClosing || origin.contentStart === origin.contentEnd) {
                return el.selfClosing ? open : open + close; // was empty: keep its form
            }
            return open.replace(/\s*>$/, '/>'); // edited empty: <tag/> (spec §12.2)
        }
        return (el.selfClosing ? open.replace(/\s*\/>$/, '>') : open) + inner + close;
    }

    /** A new element (or a copy of an already written one), written canonically. */
    private newElement(node: PMNode, name: string, indent: string, copyOf: string | null): string {
        let xml = (node.attrs.xml as Pairs | undefined) ?? [];
        if (copyOf) {
            xml = xml.filter(([key]) => key !== 'id');
        }
        const source = copyOf ? this.base.bySrc.get(copyOf) : undefined;
        const sourceEl = source ? this.origin(source)?.element : undefined;
        const sourceXml = source?.attrs.xml as Pairs | undefined;
        if (node.isAtom && typeof node.attrs.raw === 'string' && !copyOf) {
            return rawWithAttributes(node, name, xml); // pasted or copied element kept as written
        }
        if (node.isAtom) {
            if (sourceEl && !sourceEl.selfClosing) {
                const origin = this.origin(source!)!;
                return this.openTag(name, xml, sourceEl, sourceXml, false) + this.raw(origin.contentStart, origin.contentEnd) + `</${name}>`;
            }
            return this.openTag(name, xml, sourceEl, sourceXml, true);
        }
        const children = this.childrenOf(node);
        const inner = node.inlineContent ? this.inline(children) : this.blockList(children, indent, this.base.indentUnit ? `\n${indent}${this.base.indentUnit}` : '');
        if (inner === '') {
            return this.openTag(name, xml, sourceEl, sourceXml, true);
        }
        return this.openTag(name, xml, sourceEl, sourceXml, false) + inner + `</${name}>`;
    }

    /**
     * Children of a new container: one per line at the child indentation. In mixed content
     * (text beside blocks) no layout whitespace is added: there it would be text.
     */
    private blockList(children: PMNode[], indent: string, sep: string): string {
        if (children.length === 0) {
            return '';
        }
        if (children.some((c) => c.type.name === SYNTHETIC.textrun)) {
            sep = '';
        }
        const childIndent = sep.includes('\n') ? sep.slice(sep.lastIndexOf('\n') + 1) : indent;
        let out = '';
        children.forEach((child, k) => {
            const textrun = child.type.name === SYNTHETIC.textrun;
            if (!textrun && (k === 0 || children[k - 1].type.name !== SYNTHETIC.textrun)) {
                out += sep;
            }
            out += this.placed(child, childIndent);
        });
        const last = children[children.length - 1];
        return last.type.name === SYNTHETIC.textrun || !sep.includes('\n') ? out : `${out}\n${indent}`;
    }

    /**
     * A child written where it was not in the source: one that has source text — moved here
     * from another parent (a map row indented or dragged, a list item nested) — keeps its layout
     * but is re-indented as a whole, its lines shifted from its old indentation to `indent`. Not
     * when it shares its first line with other content, or holds whitespace-preserving content.
     */
    private placed(child: PMNode, indent: string): string {
        const src = typeof child.attrs.src === 'string' ? child.attrs.src : undefined;
        const copy = src !== undefined && this.written.has(src);
        const text = this.node(child, indent);
        const old = this.origin(child) ?? (src && !copy ? this.origin(this.base.bySrc.get(src)!) : undefined);
        if (!old || !text.includes('\n') || PRESERVING.test(text)) {
            return text;
        }
        const source = this.base.source;
        const lineStart = source.lastIndexOf('\n', old.start - 1) + 1;
        if (!/^[ \t]*$/.test(source.slice(lineStart, old.start))) {
            return text;
        }
        const from = source.slice(lineStart, old.start);
        if (from === indent) {
            return text;
        }
        return text.split('\n').map((line, k) => (k > 0 && line.startsWith(from) ? indent + line.slice(from.length) : line)).join('\n');
    }

    // -- alignment -------------------------------------------------------------------------------

    private outerStart(node: PMNode): number {
        const origin = this.origin(node)!;
        return origin.markEls?.[0]?.range.start ?? origin.start;
    }

    private outerEnd(node: PMNode): number {
        const origin = this.origin(node)!;
        return origin.markEls?.[0]?.range.end ?? origin.end;
    }

    private shareMark(a: PMNode, b: PMNode): boolean {
        const ea = this.origin(a)?.markEls ?? [];
        return ea.length > 0 && (this.origin(b)?.markEls ?? []).some((m) => ea.includes(m));
    }

    /**
     * Content of a changed node: `oldNode` is the node built at load (its children have
     * origins), [cStart, cEnd) its content in the source.
     */
    private children(oldNode: PMNode, node: PMNode, cStart: number, cEnd: number, indent: string): string {
        const old = this.childrenOf(oldNode);
        const neu = this.childrenOf(node);
        let i = 0;
        while (i < old.length && i < neu.length && old[i] === neu[i]) {
            i++;
        }
        let jo = old.length;
        let jn = neu.length;
        while (jo > i && jn > i && old[jo - 1] === neu[jn - 1]) {
            jo--;
            jn--;
        }
        if (i === jo && i === jn) {
            return this.raw(cStart, cEnd);
        }
        if (old.length === 0) {
            // Nothing to align with (the content was only layout, or empty).
            if (node.inlineContent) {
                return this.inline(neu);
            }
            return this.blockList(neu, indent, this.separator([], cStart, cEnd, indent));
        }
        if (oldNode.inlineContent || node.inlineContent) {
            return this.inlineMiddle(old, neu, i, jo, jn, cStart, cEnd, indent, node.inlineContent);
        }
        return this.blockMiddle(old, neu, i, jo, jn, cStart, cEnd, indent);
    }

    private inlineMiddle(old: PMNode[], neu: PMNode[], i: number, jo: number, jn: number,
        cStart: number, cEnd: number, indent: string, inlineResult: boolean): string {
        if (jo - i === 1 && jn - i === 1 && inlineResult) {
            const a = old[i];
            const b = neu[i];
            if (Mark.sameSet(a.marks, b.marks)) {
                const origin = this.origin(a)!;
                if (a.isText && b.isText && origin.text) {
                    // Edited in place: only the typed characters change.
                    const edit = projectText(origin.text, b.text ?? '');
                    return this.raw(cStart, edit.start) + edit.text + this.raw(edit.end, cEnd);
                }
                if (!a.isText && !b.isText && a.attrs.src !== null && a.attrs.src === b.attrs.src) {
                    // The same phrase, changed inside: rewrite only it (its marks are unchanged).
                    return this.raw(cStart, origin.start) + this.node(b, indent) + this.raw(origin.end, cEnd);
                }
            }
        }
        if (inlineResult) {
            const direct = this.characterEdit(old.slice(i, jo), neu.slice(i, jn), i > 0 ? old[i - 1] : undefined, old[jo],
                [...old.slice(0, i), ...old.slice(jo)]);
            if (direct === 'unchanged') {
                return this.raw(cStart, cEnd);
            }
            if (direct) {
                return this.raw(cStart, direct.start) + direct.text + this.raw(direct.end, cEnd);
            }
        }
        // Widen the changed middle until no highlight element straddles its boundaries.
        for (;;) {
            let moved = false;
            if (i > 0 && i < old.length && this.shareMark(old[i - 1], old[i])) {
                i--;
                moved = true;
            }
            if (jo > 0 && jo < old.length && this.shareMark(old[jo - 1], old[jo])) {
                jo++;
                jn++;
                moved = true;
            }
            if (!moved) {
                break;
            }
        }
        let start: number;
        let end: number;
        if (i < jo) {
            start = this.outerStart(old[i]);
            end = this.outerEnd(old[jo - 1]);
        } else {
            start = end = i > 0 ? this.outerEnd(old[i - 1]) : this.outerStart(old[0]);
        }
        const middle = neu.slice(i, jn);
        const written = inlineResult ? this.inline(middle, this.markOnlySources(old.slice(i, jo), middle)) : this.blockList(middle, indent, '');
        return this.raw(cStart, start) + written + this.raw(end, cEnd);
    }

    /**
     * The changed middle as one source edit, computed character by character across nodes:
     * a deletion (of text, phrases, entities — any formatting), an insertion of uniformly
     * formatted text where that formatting already is, or a replacement inside one
     * formatting context. The deleted range is widened to whole highlight elements and
     * CDATA sections, never cutting one. Undefined when the change is not of that shape.
     */
    private characterEdit(oldMid: PMNode[], newMid: PMNode[], before: PMNode | undefined, after: PMNode | undefined,
        untouched: PMNode[]): { start: number; end: number; text: string } | 'unchanged' | undefined {
        interface Unit { node: PMNode; k: number }
        const unitsOf = (nodes: PMNode[]): Unit[] => {
            const out: Unit[] = [];
            for (const node of nodes) {
                if (node.isText) {
                    for (let k = 0; k < node.text!.length; k++) {
                        out.push({ node, k });
                    }
                } else {
                    out.push({ node, k: -1 });
                }
            }
            return out;
        };
        const eq = (a: Unit, b: Unit): boolean => (a.k === -1 || b.k === -1)
            ? a.node === b.node
            : a.node.text![a.k] === b.node.text![b.k] && Mark.sameSet(a.node.marks, b.node.marks);
        const oldU = unitsOf(oldMid);
        const newU = unitsOf(newMid);
        let p = 0;
        while (p < oldU.length && p < newU.length && eq(oldU[p], newU[p])) {
            p++;
        }
        let s = 0;
        while (s < oldU.length - p && s < newU.length - p && eq(oldU[oldU.length - 1 - s], newU[newU.length - 1 - s])) {
            s++;
        }
        const deleted = oldU.slice(p, oldU.length - s);
        const inserted = newU.slice(p, newU.length - s);
        if (inserted.some((u) => u.k === -1)) {
            return undefined;
        }
        const marks = inserted[0]?.node.marks;
        if (marks && inserted.some((u) => !Mark.sameSet(u.node.marks, marks))) {
            return undefined;
        }
        const textOf = (u: Unit): TextOrigin | undefined => this.origin(u.node)?.text;
        const rawStart = (u: Unit): number => (u.k === -1 ? this.origin(u.node)!.start : textOf(u)!.map[u.k]);
        const rawEnd = (u: Unit): number => (u.k === -1 ? this.origin(u.node)!.end : textOf(u)!.map[u.k + 1]);
        if (oldU.some((u) => !this.origin(u.node) || (u.k !== -1 && !textOf(u)))) {
            return undefined;
        }
        let start: number;
        let end: number;
        if (deleted.length > 0) {
            start = rawStart(deleted[0]);
            end = rawEnd(deleted[deleted.length - 1]);
            if (marks && deleted.some((u) => u.k === -1 || !Mark.sameSet(u.node.marks, marks))) {
                return undefined; // a replacement must stay in one formatting context
            }
        } else {
            if (!marks) {
                return 'unchanged';
            }
            // Insert inside a neighbouring text (in the middle, or just outside it) that has
            // exactly the inserted formatting.
            const prev: Unit | undefined = p > 0 ? oldU[p - 1] : before?.isText ? { node: before, k: before.text!.length - 1 } : undefined;
            const next: Unit | undefined = p < oldU.length ? oldU[p] : after?.isText ? { node: after, k: 0 } : undefined;
            const fits = (u: Unit | undefined): u is Unit => u !== undefined && u.k !== -1 && Mark.sameSet(u.node.marks, marks) && textOf(u) !== undefined;
            if (fits(prev)) {
                start = end = rawEnd(prev);
            } else if (fits(next)) {
                start = end = rawStart(next);
            } else {
                return undefined;
            }
        }
        if (deleted.length > 0) {
            // Containers a deleted unit sits in: highlight elements and CDATA sections.
            const containersOf = (u: Unit): { start: number; end: number }[] => {
                const origin = this.origin(u.node)!;
                const out = (origin.markEls ?? []).map((m) => m.range);
                if (origin.text?.cdata) {
                    out.push({ start: origin.start, end: origin.end });
                }
                return out;
            };
            // Everything of the parent that stays: unchanged units of the middle and the
            // untouched siblings around it.
            const kept = [...oldU.slice(0, p), ...oldU.slice(oldU.length - s), ...unitsOf(untouched)];
            const keptIn = (range: { start: number; end: number }): boolean => kept.some((u) => containersOf(u).some((r) => r.start === range.start && r.end === range.end));
            for (let changed = true; changed;) {
                changed = false;
                for (const u of deleted) {
                    for (const range of containersOf(u)) {
                        const inside = range.start >= start && range.end <= end;
                        if (inside) {
                            continue;
                        }
                        if (!keptIn(range) && inserted.length === 0) {
                            // Nothing of the element is left: it goes too (no empty <b></b>).
                            start = Math.min(start, range.start);
                            end = Math.max(end, range.end);
                            changed = true;
                        } else if (!(range.start <= start && range.end >= end)) {
                            return undefined; // would cut an element that keeps other content
                        }
                    }
                }
            }
        }
        const text = inserted.map((u) => u.node.text![u.k]).join('');
        const cdata = marks?.some((m) => m.type.name === CDATA_MARK) ?? false;
        return { start, end, text: cdata ? cdataText(text) : escapeText(text) };
    }

    /**
     * When only formatting changed in a middle (same text, same phrases, different marks —
     * bolding a word — or text moved into a new phrase element, `<uicontrol>` around a word),
     * the source text of each new text node: its slice of the old text's source, so line breaks
     * and entity references inside it survive.
     */
    private markOnlySources(oldMid: PMNode[], newMid: PMNode[]): Map<PMNode, string> | undefined {
        const segments = (list: PMNode[], intoNew: boolean): { texts: PMNode[]; atom?: PMNode }[] => {
            const out: { texts: PMNode[]; atom?: PMNode }[] = [{ texts: [] }];
            const visit = (n: PMNode): void => {
                if (n.isText) {
                    out[out.length - 1].texts.push(n);
                } else if (intoNew && n.isInline && !n.isAtom && !this.origin(n) && n.attrs.src === null) {
                    n.forEach(visit); // a new phrase element: its text is the old text, wrapped
                } else {
                    out.push({ texts: [], atom: n });
                }
            };
            list.forEach(visit);
            return out;
        };
        const so = segments(oldMid, false);
        const sn = segments(newMid, true);
        if (so.length !== sn.length || so.some((s, k) => s.atom !== sn[k].atom)) {
            return undefined;
        }
        const sources = new Map<PMNode, string>();
        for (let k = 0; k < so.length; k++) {
            const olds = so[k].texts;
            const news = sn[k].texts;
            if (olds.map((t) => t.text).join('') !== news.map((t) => t.text).join('')) {
                return undefined;
            }
            let offset = 0;
            for (const t of news) {
                const length = t.text!.length;
                // The old text node holding [offset, offset + length), if a single one does.
                let base = 0;
                for (const o of olds) {
                    const len = o.text!.length;
                    const origin = this.origin(o);
                    const text = origin?.text;
                    const cdata = (m: readonly Mark[]) => m.some((x) => x.type.name === CDATA_MARK);
                    if (offset >= base && offset + length <= base + len && origin && text && cdata(o.marks) === cdata(t.marks)) {
                        if (!text.cdata) {
                            sources.set(t, this.raw(text.map[offset - base], text.map[offset - base + length]));
                        } else if (offset === base && length === len) {
                            sources.set(t, this.raw(origin.start, origin.end)); // the whole CDATA section
                        }
                        break;
                    }
                    base += len;
                }
                offset += length;
            }
        }
        return sources;
    }

    /** Whitespace separating sibling blocks in this container (or the file's default). */
    private separator(old: PMNode[], cStart: number, cEnd: number, indent: string): string {
        for (let k = 1; k < old.length; k++) {
            if (old[k - 1].type.name !== SYNTHETIC.textrun && old[k].type.name !== SYNTHETIC.textrun) {
                const ws = this.raw(this.outerEnd(old[k - 1]), this.outerStart(old[k]));
                if (/^\s*$/.test(ws)) {
                    return ws;
                }
            }
        }
        if (old.length > 0 && old[0].type.name !== SYNTHETIC.textrun) {
            const ws = this.raw(cStart, this.outerStart(old[0]));
            if (ws !== '' && /^\s*$/.test(ws)) {
                return ws;
            }
        } else if (old.length === 0 && /^\s+$/.test(this.raw(cStart, cEnd)) && this.raw(cStart, cEnd).includes('\n')) {
            return `\n${indent}${this.base.indentUnit}`;
        }
        return this.base.indentUnit ? `\n${indent}${this.base.indentUnit}` : '';
    }

    private blockMiddle(old: PMNode[], neu: PMNode[], i: number, jo: number, jn: number,
        cStart: number, cEnd: number, indent: string): string {
        const isRun = (n: PMNode | undefined): boolean => n?.type.name === SYNTHETIC.textrun;
        const oldMid = old.slice(i, jo);
        const middle = neu.slice(i, jn);
        const sep = this.separator(old, cStart, cEnd, indent);
        const childIndent = sep.includes('\n') ? sep.slice(sep.lastIndexOf('\n') + 1) : indent;

        // Source element id of a node (text runs and synthetic nodes have none).
        // The same blocks in another order (Move up/down): each written as it was (or as it was
        // edited), and what lay between them (layout, comments) stays where it was.
        const srcOf = (n: PMNode): string | undefined => (typeof n.attrs.src === 'string' ? n.attrs.src : undefined);
        const reordered = (): boolean => {
            if (i >= jo || middle.length !== oldMid.length || middle.length < 2) {
                return false;
            }
            const used = new Set<PMNode>();
            for (const n of middle) {
                const match = oldMid.find((o) => !used.has(o) && (o === n || (srcOf(n) !== undefined && srcOf(o) === srcOf(n))));
                if (!match) {
                    return false;
                }
                used.add(match);
            }
            return middle.some((n, k) => n !== oldMid[k] && srcOf(n) !== srcOf(oldMid[k]));
        };
        if (reordered()) {
            let moved = '';
            middle.forEach((child, k) => {
                if (k > 0) {
                    moved += this.raw(this.outerEnd(oldMid[k - 1]), this.outerStart(oldMid[k]));
                }
                moved += this.node(child, childIndent);
            });
            return this.raw(cStart, this.outerStart(old[i])) + moved + this.raw(this.outerEnd(old[jo - 1]), cEnd);
        }

        // Match new children to the old ones they continue: by source element, or — when
        // both middles have the same shape (an undo, a change inside each) — position by
        // position, text runs included. Between two old children that are still adjacent,
        // the source between them (layout, comments) is kept.
        const pairwise = oldMid.length === middle.length
            && middle.every((n, k) => (isRun(n) && isRun(oldMid[k])) || (srcOf(n) !== undefined && srcOf(n) === srcOf(oldMid[k])));
        const matchOf: number[] = [];
        let from = 0;
        for (const n of middle) {
            let m = -1;
            if (pairwise) {
                m = matchOf.length;
            } else if (srcOf(n) !== undefined) {
                const k = oldMid.findIndex((o, idx) => idx >= from && srcOf(o) === srcOf(n));
                if (k !== -1) {
                    m = k;
                    from = k + 1;
                }
            }
            matchOf.push(m);
        }
        let written = '';
        let lastOld = -1;
        middle.forEach((child, k) => {
            const m = matchOf[k];
            if (k > 0) {
                if (m !== -1 && lastOld !== -1 && m === lastOld + 1) {
                    written += this.raw(this.outerEnd(oldMid[lastOld]), this.outerStart(oldMid[m]));
                } else if (!isRun(middle[k - 1]) && !isRun(child)) {
                    written += sep;
                }
            }
            if (m !== -1 && isRun(child) && isRun(oldMid[m])) {
                // Text edited inside a paragraph-like run of a mixed element.
                const origin = this.origin(oldMid[m])!;
                written += this.children(oldMid[m], child, origin.contentStart, origin.contentEnd, childIndent);
            } else {
                written += m === -1 ? this.placed(child, childIndent) : this.node(child, childIndent);
            }
            lastOld = m;
        });
        if (i < jo) {
            let start = this.outerStart(old[i]);
            const end = this.outerEnd(old[jo - 1]);
            if (middle.length === 0) {
                // A deletion also removes the layout whitespace that introduced the block
                // (after a comment, the comment stays).
                const gap = this.raw(i > 0 ? this.outerEnd(old[i - 1]) : cStart, start);
                start -= /\s*$/.exec(gap)?.[0].length ?? 0;
            }
            return this.raw(cStart, start) + written + this.raw(end, cEnd);
        }
        // Insertion between old[i-1] and old[i].
        if (i > 0) {
            const at = this.outerEnd(old[i - 1]);
            const lead = !isRun(old[i - 1]) && !isRun(middle[0]) ? sep : '';
            return this.raw(cStart, at) + lead + written + this.raw(at, cEnd);
        }
        const at = this.outerStart(old[0]);
        const trail = !isRun(old[0]) && !isRun(middle[middle.length - 1]) ? sep : '';
        return this.raw(cStart, at) + written + trail + this.raw(at, cEnd);
    }

    // -- inline content ---------------------------------------------------------------------------

    private markDepth(mark: Mark): number {
        const src = mark.attrs.src as string | null | undefined;
        const el = src ? this.base.index.element(src) : undefined;
        if (!el) {
            return Number.MAX_SAFE_INTEGER;
        }
        let depth = 0;
        for (let p = el.parent; p; p = p.parent) {
            depth++;
        }
        return depth;
    }

    /** Marks of a node outermost first: source nesting where known, then schema order. */
    private orderedMarks(marks: readonly Mark[]): Mark[] {
        return marks
            .filter((m) => m.type.name !== CDATA_MARK)
            .map((m, rank) => ({ m, rank, depth: this.markDepth(m) }))
            .sort((a, b) => a.depth - b.depth || a.rank - b.rank)
            .map((x) => x.m);
    }

    private markTags(mark: Mark): { open: string; close: string } {
        const name = this.base.editorSchema.markElement(mark.type) ?? 'ph';
        const src = mark.attrs.src as string | null | undefined;
        const el = src ? this.base.index.element(src) : undefined;
        if (el && el.name === name && el.closeTagRange) {
            return { open: this.raw(el.openTagRange.start, el.openTagRange.end), close: this.raw(el.closeTagRange.start, el.closeTagRange.end) };
        }
        return { open: `<${name}>`, close: `</${name}>` };
    }

    /**
     * Inline nodes written from a clean boundary: highlight marks become elements again.
     * `textSource` gives the source text to use for some new text nodes (markOnlySources),
     * also inside new phrase elements written meanwhile.
     */
    private inline(nodes: PMNode[], textSource?: Map<PMNode, string>): string {
        if (textSource && textSource !== this.textSource) {
            const outer = this.textSource;
            this.textSource = textSource;
            try {
                return this.inline(nodes, textSource);
            } finally {
                this.textSource = outer;
            }
        }
        textSource = textSource ?? this.textSource;
        let out = '';
        const stack: Mark[] = [];
        for (const node of nodes) {
            const marks = this.orderedMarks(node.marks);
            let keep = 0;
            while (keep < stack.length && keep < marks.length && stack[keep].eq(marks[keep])) {
                keep++;
            }
            while (stack.length > keep) {
                out += this.markTags(stack.pop()!).close;
            }
            for (let k = keep; k < marks.length; k++) {
                out += this.markTags(marks[k]).open;
                stack.push(marks[k]);
            }
            const source = textSource?.get(node);
            if (source !== undefined) {
                // Written as a whole CDATA section when that is what it was.
                out += source;
                continue;
            }
            out += this.node(node, '');
        }
        while (stack.length > 0) {
            out += this.markTags(stack.pop()!).close;
        }
        return out;
    }
}
