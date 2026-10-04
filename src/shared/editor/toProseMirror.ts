/**
 * CST → ProseMirror document (spec §13.1, `toProseMirror`).
 *
 * Builds the editor document from the parsed source and records, for every node it
 * creates, where that node came from (`Base.origin`). The serializer (toSource.ts) uses
 * that table to write unchanged nodes back byte for byte and to confine every edit to the
 * bytes it touches: ProseMirror shares unchanged nodes between document versions, so
 * "same object as at load" means "unchanged".
 *
 * Text is shown the way it reads, not the way it is laid out in the file: entity
 * references are decoded (named ones other than the five predefined become atoms that are
 * never rewritten), runs of layout whitespace collapse to one space, and whitespace at
 * the edges of a paragraph is not shown. Each text node keeps a map from its displayed
 * characters back to source offsets, so typing in a wrapped, indented paragraph changes
 * only the typed characters in the file.
 *
 * Whitespace between blocks, and comments/processing instructions between blocks, are
 * layout: they are not nodes, they stay in the source between the nodes around them.
 *
 * Environment-neutral.
 */

import { Fragment, Mark, type MarkType, type Node as PMNode, type NodeType } from 'prosemirror-model';
import { ElementIndex } from '../cst/elementIndex';
import { parse } from '../cst/parse';
import { attr, rawTextContent, rootElement } from '../cst/query';
import { computeGrid, isGridValid } from '../cst/tableGrid';
import type { CstNode, Document, ElementNode } from '../cst/types';
import { isElement } from '../cst/types';
import { decodeXmlText, type EntityLookup } from '../render/html';
import { tgroupWidths } from './columnWidths';
import { CDATA_MARK, SYNTHETIC, type EditorSchema, type ElementFacts } from './schema';

/** Source mapping of a text node: display character k starts at source offset map[k]. */
export interface TextOrigin {
    display: string;
    /** display.length + 1 absolute offsets; map[display.length] is the end of the last character. */
    map: number[];
    cdata: boolean;
}

export interface NodeOrigin {
    /** Absolute source range of the node (text: its displayed characters only). */
    start: number;
    end: number;
    /** Element / textrun content range (between the tags). */
    contentStart: number;
    contentEnd: number;
    /** The CST element of an element node. */
    element?: ElementNode;
    /** Mark elements enclosing an inline node inside its textblock, outermost first. */
    markEls?: ElementNode[];
    text?: TextOrigin;
}

/** Everything the serializer needs about the parse a document was built from. */
export interface Base {
    source: string;
    cst: Document;
    index: ElementIndex;
    root: ElementNode;
    editorSchema: EditorSchema;
    origin: WeakMap<PMNode, NodeOrigin>;
    /** The node built for each source element, by element id. */
    bySrc: Map<string, PMNode>;
    /** Indentation unit of the file ("  ", "    ", "\t"…); "" when it is not indented. */
    indentUnit: string;
}

export interface BuildResult {
    doc: PMNode;
    base: Base;
}

const PREDEFINED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const REF = /&(#x[0-9a-fA-F]+|#[0-9]+|[A-Za-z_:][\w.:-]*);/y;
const WS = /[ \t\r\n]/;

/** Instance attributes the editor treats as not making an element "attributed" (marks). */
const NEUTRAL_ATTRIBUTES = new Set(['class']);

function codePoint(cp: number): string | undefined {
    if (!Number.isFinite(cp) || cp <= 0 || cp > 0x10ffff) {
        return undefined;
    }
    try {
        return String.fromCodePoint(cp);
    } catch {
        return undefined;
    }
}

type Piece =
    | { kind: 'text'; display: string; map: number[] }
    | { kind: 'entity'; name: string; start: number; end: number };

/**
 * Split raw text (absolute offset `start`) into displayed text pieces and named-entity
 * references. With `preserve` false, whitespace runs collapse to one space mapped to the
 * whole run.
 */
export function decodeText(raw: string, start: number, preserve: boolean): Piece[] {
    const pieces: Piece[] = [];
    let display = '';
    let map: number[] = [];
    const flush = (end: number): void => {
        if (display !== '') {
            map.push(end);
            pieces.push({ kind: 'text', display, map });
        }
        display = '';
        map = [];
    };
    let i = 0;
    while (i < raw.length) {
        const ch = raw[i];
        if (ch === '&') {
            REF.lastIndex = i;
            const m = REF.exec(raw);
            if (m) {
                const ref = m[1];
                let decoded: string | undefined;
                if (ref.startsWith('#x')) {
                    decoded = codePoint(parseInt(ref.slice(2), 16));
                } else if (ref.startsWith('#')) {
                    decoded = codePoint(parseInt(ref.slice(1), 10));
                } else {
                    decoded = PREDEFINED[ref];
                }
                if (decoded !== undefined) {
                    for (let k = 0; k < decoded.length; k++) {
                        display += decoded[k];
                        map.push(start + i);
                    }
                } else if (!ref.startsWith('#')) {
                    flush(start + i);
                    pieces.push({ kind: 'entity', name: ref, start: start + i, end: start + i + m[0].length });
                } else {
                    for (let k = 0; k < m[0].length; k++) {
                        display += m[0][k];
                        map.push(start + i + k);
                    }
                }
                i += m[0].length;
                continue;
            }
        }
        if (!preserve && WS.test(ch)) {
            let j = i + 1;
            while (j < raw.length && WS.test(raw[j])) {
                j++;
            }
            display += ' ';
            map.push(start + i);
            i = j;
            continue;
        }
        if (preserve && ch === '\r' && raw[i + 1] === '\n') {
            display += '\n';
            map.push(start + i);
            i += 2;
            continue;
        }
        display += ch;
        map.push(start + i);
        i++;
    }
    flush(start + raw.length);
    return pieces;
}

/** Indentation unit used by the file. */
export function detectIndentUnit(source: string): string {
    let best = '';
    for (const m of source.matchAll(/\n([ \t]+)</g)) {
        const ws = m[1];
        if (ws.includes('\t')) {
            return '\t';
        }
        if (best === '' || ws.length < best.length) {
            best = ws;
        }
    }
    return best;
}

function summary(text: string, max = 120): string {
    const t = text.replace(/\s+/g, ' ').trim();
    return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

interface InlineState {
    marks: readonly Mark[];
    markEls: ElementNode[];
    preserve: boolean;
}

class Builder {
    readonly origin = new WeakMap<PMNode, NodeOrigin>();
    readonly bySrc = new Map<string, PMNode>();
    private readonly entrySpans = new Map<ElementNode, { colspan: number; rowspan: number }>();
    /** Text nodes of the inline content being built, for edge trimming and space joining. */
    private textTail: { node: PMNode; origin: NodeOrigin } | undefined;

    constructor(
        private readonly source: string,
        private readonly index: ElementIndex,
        private readonly es: EditorSchema,
        private readonly entity: EntityLookup | undefined,
    ) {}

    private get schema() {
        return this.es.schema;
    }

    // -- element helpers ------------------------------------------------------------------

    private xmlAttrs(el: ElementNode): [string, string][] {
        return el.attrs.map((a) => [a.name, decodeXmlText(a.value, this.entity)]);
    }

    private elementOrigin(el: ElementNode): NodeOrigin {
        const contentStart = el.openTagRange.end;
        const contentEnd = el.closeTagRange ? el.closeTagRange.start : el.openTagRange.end;
        return { start: el.range.start, end: el.range.end, contentStart, contentEnd, element: el };
    }

    private register(node: PMNode, el: ElementNode, origin: NodeOrigin = this.elementOrigin(el)): PMNode {
        this.origin.set(node, origin);
        const id = this.index.idOf(el);
        if (id) {
            this.bySrc.set(id, node);
        }
        return node;
    }

    private attrsFor(el: ElementNode, view: Record<string, unknown> | null = null): Record<string, unknown> {
        return { src: this.index.idOf(el) ?? null, xml: this.xmlAttrs(el), view };
    }

    /** Reused content and keyref'd empty phrases are shown, not edited (spec §13.7). */
    private isReference(el: ElementNode): boolean {
        const conref = attr(el, 'conref');
        return attr(el, 'conkeyref') !== undefined || (conref !== undefined && conref !== '-dita-use-conref-target');
    }

    private opaqueView(el: ElementNode, facts: ElementFacts | undefined): Record<string, unknown> {
        const conref = attr(el, 'conkeyref') ?? attr(el, 'conref');
        if (conref && conref !== '-dita-use-conref-target') {
            return { text: `↪ ${decodeXmlText(conref, this.entity)}` };
        }
        const text = summary(decodeXmlText(rawTextContent(el), this.entity));
        const keyref = attr(el, 'keyref');
        if (!text && keyref) {
            return { text: `[${keyref}]` };
        }
        const href = attr(el, 'href');
        if (!text && href && !facts?.tokens.includes('topic/image')) {
            return { text: decodeXmlText(href, this.entity) }; // an empty link shows its target
        }
        if (facts?.tokens.includes('topic/image')) {
            const alt = el.children.find((c): c is ElementNode => isElement(c) && this.es.facts(c.name)?.tokens.includes('topic/alt') === true);
            return { text, alt: alt ? summary(decodeXmlText(rawTextContent(alt), this.entity)) : undefined };
        }
        return { text };
    }

    private opaque(el: ElementNode, context: 'block' | 'inline'): PMNode {
        const facts = this.es.facts(el.name);
        const type = facts ? this.es.nodeType(el.name, context, 'opaque') : undefined;
        if (!type) {
            const unknown = this.schema.nodes[context === 'block' ? SYNTHETIC.unknownBlock : SYNTHETIC.unknownInline];
            return this.register(unknown.create({ ...this.attrsFor(el, this.opaqueView(el, facts)), name: el.name }), el);
        }
        return this.register(type.create(this.attrsFor(el, this.opaqueView(el, facts))), el);
    }

    // -- block level ------------------------------------------------------------------------

    /** The node for an element in block context. */
    block(el: ElementNode): PMNode {
        const facts = this.es.facts(el.name);
        if (!facts || facts.placement === 'inline' || this.isReference(el) || facts.blockKind === 'opaque') {
            return this.opaque(el, 'block');
        }
        const main = this.es.nodeType(el.name, 'block')!;
        const view = this.viewFor(el, facts);
        const preserve = facts.preserve || attr(el, 'xml:space') === 'preserve';
        if (facts.blockKind === 'textblock') {
            return this.register(main.create(this.attrsFor(el, view), this.inlineContent(el.children, preserve)), el);
        }
        if (facts.blockKind === 'mixed') {
            const hasBlock = el.children.some((c) => isElement(c) && this.needsBlock(c));
            if (!hasBlock) {
                const text = this.es.nodeType(el.name, 'block', 'text')!;
                return this.register(text.create(this.attrsFor(el, view), this.inlineContent(el.children, preserve)), el);
            }
            return this.register(main.create(this.attrsFor(el, view), this.blockContent(el.children, true, preserve)), el);
        }
        // Structured container: the DTD's model, or the loose variant for an instance that
        // does not follow it.
        this.prepareTable(el, facts);
        const content = this.blockContent(el.children, false, facts.preserve);
        const type: NodeType = main.validContent(content) ? main : (this.es.nodeType(el.name, 'block', 'loose') ?? main);
        if (!type.validContent(content)) {
            return this.opaque(el, 'block');
        }
        return this.register(type.create(this.attrsFor(el, view), content), el);
    }

    /** Nodes for the elements of `children` (block context), or for `children` as inline content. */
    fragment(children: CstNode[], context: 'block' | 'inline', preserve: boolean): PMNode[] {
        if (context === 'block') {
            return children.filter(isElement).map((el) => this.block(el));
        }
        const out: PMNode[] = [];
        this.textTail = undefined;
        this.inline(children, { marks: Mark.none, markEls: [], preserve }, out);
        return out;
    }

    /** True when a child element of a block-mixed element can only be a block. */
    private needsBlock(el: ElementNode): boolean {
        const facts = this.es.facts(el.name);
        return facts?.placement === 'block';
    }

    /**
     * Block children of a container. Runs of text/phrases become `textrun`s (only valid in
     * block-mixed models; elsewhere they make the parent loose). Whitespace-only text and
     * comments/PIs between blocks are layout.
     */
    private blockContent(children: CstNode[], mixed: boolean, preserve: boolean): Fragment {
        const out: PMNode[] = [];
        let run: CstNode[] = [];
        const flush = (): void => {
            const meaningful = run.some((n) => (n.type === 'text' && n.raw.trim() !== '') || n.type === 'element' || n.type === 'cdata');
            if (meaningful) {
                const first = run[0];
                const last = run[run.length - 1];
                const textrun = this.schema.nodes[SYNTHETIC.textrun].create(null, this.inlineContent(run, preserve));
                this.origin.set(textrun, {
                    start: first.range.start, end: last.range.end, contentStart: first.range.start, contentEnd: last.range.end,
                });
                out.push(textrun);
            }
            run = [];
        };
        for (const child of children) {
            if (isElement(child)) {
                const facts = this.es.facts(child.name);
                const inline = facts !== undefined && (facts.placement === 'inline' || (mixed && facts.placement === 'dual'));
                if (inline) {
                    run.push(child);
                    continue;
                }
                flush();
                out.push(this.block(child));
                continue;
            }
            if (child.type === 'text' || child.type === 'cdata') {
                if (run.length > 0 || (child.type === 'text' ? child.raw.trim() !== '' : true)) {
                    run.push(child);
                }
                continue;
            }
            if ((child.type === 'comment' || child.type === 'pi') && run.length > 0) {
                run.push(child);
            }
        }
        flush();
        return Fragment.from(out);
    }

    // -- inline level ------------------------------------------------------------------------

    /**
     * Inline content of a textblock or textrun, trimmed at its edges. Undefined when it
     * holds something that cannot be inline (the caller keeps the element verbatim).
     */
    private inlineContent(children: CstNode[], preserve: boolean): Fragment {
        const out: PMNode[] = [];
        this.textTail = undefined;
        this.inline(children, { marks: Mark.none, markEls: [], preserve }, out);
        if (!preserve) {
            this.trimEdges(out);
        }
        // No two adjacent text nodes share their marks (entities, comments and phrases sit
        // between them), so fromArray joins nothing and every node keeps its origin.
        return Fragment.fromArray(out);
    }

    /** Leading/trailing layout space of a paragraph is not shown (it stays in the source). */
    private trimEdges(out: PMNode[]): void {
        const trim = (index: number, side: 'start' | 'end'): boolean => {
            const node = out[index];
            const origin = node?.isText ? this.origin.get(node) : undefined;
            const t = origin?.text;
            if (!node || !origin || !t || t.cdata) {
                return false;
            }
            let { display, map } = t;
            if (side === 'start' && display.startsWith(' ')) {
                display = display.slice(1);
                map = map.slice(1);
            } else if (side === 'end' && display.endsWith(' ')) {
                display = display.slice(0, -1);
                map = map.slice(0, -1);
            } else {
                return false;
            }
            if (display === '') {
                out.splice(index, 1);
                return true; // the next node is now at the edge
            }
            const replacement = this.schema.text(display, node.marks);
            this.origin.set(replacement, { ...origin, start: map[0], end: map[map.length - 1], text: { ...t, display, map } });
            out[index] = replacement;
            return false;
        };
        while (out.length > 0 && trim(0, 'start')) {
            // keep trimming
        }
        while (out.length > 0 && trim(out.length - 1, 'end')) {
            // keep trimming
        }
    }

    /** Append the inline nodes for `children` to `out`. */
    private inline(children: CstNode[], state: InlineState, out: PMNode[]): void {
        for (const child of children) {
            switch (child.type) {
                case 'text':
                    this.text(child.raw, child.range.start, state, out);
                    break;
                case 'cdata': {
                    const start = child.range.start + 9;
                    const end = child.range.end - 3;
                    const display = this.source.slice(start, end);
                    if (display === '') {
                        break;
                    }
                    const map: number[] = [];
                    for (let k = 0; k <= display.length; k++) {
                        map.push(start + k);
                    }
                    const marks = this.schema.marks[CDATA_MARK].create().addToSet(state.marks);
                    const node = this.schema.text(display, marks);
                    // The node's range is the whole section (copied as is); its map points inside it.
                    this.origin.set(node, {
                        start: child.range.start, end: child.range.end, contentStart: start, contentEnd: end,
                        markEls: state.markEls, text: { display, map, cdata: true },
                    });
                    out.push(node);
                    this.textTail = undefined;
                    break;
                }
                case 'comment':
                case 'pi': {
                    const raw = this.source.slice(child.range.start, child.range.end);
                    const type = this.schema.nodes[child.type === 'comment' ? SYNTHETIC.comment : SYNTHETIC.pi];
                    const node = type.create({ text: child.type === 'comment' ? raw.slice(4, -3) : raw.slice(2, -2) }, null, state.marks);
                    this.origin.set(node, { start: child.range.start, end: child.range.end, contentStart: child.range.start, contentEnd: child.range.end, markEls: state.markEls });
                    out.push(node);
                    break;
                }
                case 'element':
                    this.inlineElement(child, state, out);
                    break;
                default:
                    break;
            }
        }
    }

    private text(raw: string, start: number, state: InlineState, out: PMNode[]): void {
        for (const piece of decodeText(raw, start, state.preserve)) {
            if (piece.kind === 'entity') {
                const value = this.entity?.(piece.name);
                const node = this.schema.nodes[SYNTHETIC.entity].create({ name: piece.name, text: value ?? `&${piece.name};` }, null, state.marks);
                this.origin.set(node, { start: piece.start, end: piece.end, contentStart: piece.start, contentEnd: piece.end, markEls: state.markEls });
                out.push(node);
                this.textTail = undefined;
                continue;
            }
            let { display, map } = piece;
            // A space right after a displayed space (across element boundaries) is layout.
            if (!state.preserve && display.startsWith(' ') && this.textTail?.origin.text?.display.endsWith(' ')) {
                display = display.slice(1);
                map = map.slice(1);
                if (display === '') {
                    continue;
                }
            }
            const node = this.schema.text(display, state.marks);
            const origin: NodeOrigin = {
                start: map[0], end: map[map.length - 1], contentStart: map[0], contentEnd: map[map.length - 1],
                markEls: state.markEls, text: { display, map, cdata: false },
            };
            this.origin.set(node, origin);
            out.push(node);
            this.textTail = { node, origin };
        }
    }

    private inlineElement(el: ElementNode, state: InlineState, out: PMNode[]): void {
        const facts = this.es.facts(el.name);
        const pushOpaque = (): void => {
            out.push(this.withMarks(this.opaque(el, 'inline'), state));
            this.textTail = undefined;
        };
        const hasBlock = el.children.some((c) => isElement(c) && this.needsBlock(c));
        const empty = el.children.every((c) => c.type === 'text' && c.raw === '');
        const blank = el.children.every((c) => c.type === 'text' && c.raw.trim() === '');
        if (!facts || facts.placement === 'block' || this.isReference(el) || facts.inlineKind === 'opaque' || hasBlock) {
            pushOpaque();
            return;
        }
        // An empty phrase (an empty <b/>, a keyref'd keyword whose text comes from the key)
        // has nothing to edit: keep it whole.
        if (empty || (blank && attr(el, 'keyref') !== undefined)) {
            pushOpaque();
            return;
        }
        const markType: MarkType | undefined = this.es.markType(el.name);
        if (markType && !markType.isInSet(state.marks) && el.attrs.every((a) => NEUTRAL_ATTRIBUTES.has(a.name))) {
            const mark = markType.create({ src: this.index.idOf(el) ?? null });
            this.inline(el.children, { marks: mark.addToSet(state.marks), markEls: [...state.markEls, el], preserve: state.preserve }, out);
            return;
        }
        const inner: PMNode[] = [];
        const saved = this.textTail;
        this.textTail = undefined;
        this.inline(el.children, { marks: Mark.none, markEls: [], preserve: state.preserve || facts.preserve }, inner);
        this.textTail = saved;
        const type = this.es.nodeType(el.name, 'inline')!;
        const node = type.create(this.attrsFor(el), Fragment.fromArray(inner), state.marks);
        this.register(node, el, { ...this.elementOrigin(el), markEls: state.markEls });
        out.push(node);
        this.textTail = undefined;
    }

    /** An atom inside highlight elements: their marks, and their elements in its origin (as text has). */
    private withMarks(node: PMNode, state: InlineState): PMNode {
        if (state.marks.length === 0) {
            return node;
        }
        const marked = node.mark(state.marks);
        const origin = this.origin.get(node);
        if (origin) {
            this.origin.set(marked, { ...origin, markEls: state.markEls });
            const src = node.attrs.src as string | null;
            if (src) {
                this.bySrc.set(src, marked);
            }
        }
        return marked;
    }

    // -- presentation hints ----------------------------------------------------------------------

    private prepareTable(el: ElementNode, facts: ElementFacts): void {
        if (!facts.tokens.includes('topic/tgroup')) {
            return;
        }
        try {
            const grid = computeGrid(el);
            if (!isGridValid(grid)) {
                return;
            }
            for (const cell of grid.cells) {
                this.entrySpans.set(cell.entry, { colspan: cell.colEnd - cell.colStart + 1, rowspan: cell.rowSpan });
            }
        } catch {
            // Malformed table: no spans.
        }
    }

    /** Table cell spans (computed when the cell's tgroup was built), and a tgroup's column widths. */
    private viewFor(el: ElementNode, facts: ElementFacts): Record<string, unknown> | null {
        if (facts.tokens.includes('topic/tgroup')) {
            const colspecs = el.children.filter((c): c is ElementNode => isElement(c) && (this.es.facts(c.name)?.tokens.includes('topic/colspec') ?? false));
            const widths = tgroupWidths(Number(attr(el, 'cols')) || colspecs.length, colspecs.map((c) => attr(c, 'colwidth')));
            return widths ? { widths } : null;
        }
        return facts.tokens.includes('topic/entry') ? (this.entrySpans.get(el) ?? null) : null;
    }
}

/**
 * Nodes for a piece of DITA source inserted as new content (Replace with copy): built like a
 * loaded document, then detached from that source — no source element ids, so the writer
 * writes them as new elements — except that kept-as-written atoms carry their source text
 * (`attrs.raw`). `context`: elements in block context, or inline content.
 */
export function buildFragment(xml: string, es: EditorSchema, context: 'block' | 'inline', options: { entity?: EntityLookup; preserve?: boolean } = {}): PMNode[] {
    const source = `<dc-fragment>${xml}</dc-fragment>`;
    const cst = parse(source);
    const root = rootElement(cst)!;
    const builder = new Builder(source, new ElementIndex(cst), es, options.entity);
    return builder.fragment(root.children, context, options.preserve ?? false).map((node) => detachNode(node, builder.origin, source));
}

/**
 * A node of a build detached from its source: no source element ids (in its marks too), so the
 * writer writes it as new content — except that kept-as-written atoms carry their source text
 * (`attrs.raw`, from `source`, the text the build was made from).
 */
export function detachNode(node: PMNode, origin: WeakMap<PMNode, NodeOrigin>, source: string): PMNode {
    const marks = node.marks.map((m) => ('src' in m.attrs ? m.type.create({ ...m.attrs, src: null }) : m));
    if (node.isText) {
        return node.type.schema.text(node.text!, marks);
    }
    let attrs = node.attrs;
    if ('src' in attrs) {
        const o = origin.get(node);
        const raw = node.isAtom && 'raw' in attrs && o?.element ? source.slice(o.start, o.end) : attrs.raw;
        attrs = { ...attrs, src: null, ...('raw' in attrs ? { raw } : {}) };
    }
    const children: PMNode[] = [];
    node.forEach((child) => children.push(detachNode(child, origin, source)));
    return node.type.create(attrs, children, marks);
}

/** Build the editor document for a parsed source. */
export function buildDocument(cst: Document, es: EditorSchema, options: { entity?: EntityLookup } = {}): BuildResult {
    const root = rootElement(cst);
    if (!root) {
        throw new Error('The document has no root element.');
    }
    const index = new ElementIndex(cst);
    const builder = new Builder(cst.source, index, es, options.entity);
    const rootNode = builder.block(root);
    const doc = es.schema.topNodeType.create(null, rootNode);
    return {
        doc,
        base: {
            source: cst.source,
            cst,
            index,
            root,
            editorSchema: es,
            origin: builder.origin,
            bySrc: builder.bySrc,
            indentUnit: detectIndentUnit(cst.source),
        },
    };
}
