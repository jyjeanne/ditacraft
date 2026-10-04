/*
 * Portions derived from DITA Editor (https://github.com/sageata/dita-editor), file
 * src/render/to-html.ts (CALS table presentation, span-aware header association, image
 * sizing, DITA-OT class contract).
 * Copyright 2026 Paul Razvan Sarbu. Licensed under the Apache License, Version 2.0;
 * see LICENSE-THIRD-PARTY/apache-2.0.txt.
 * Modified by DitaCraft (2026): read-only renderer rewritten around @class-token dispatch
 * (specializations render like their base element); full DITA 1.3 vocabulary; entity
 * decoding; whitespace handling for inline elements; CDATA text; footnotes, figure/table
 * numbering, localized labels; DITAVAL decisions; reference resolutions; MathML/SVG
 * passthrough; `data-struct-id` on every element for source sync. Editing hooks removed.
 */

/**
 * CST → HTML for the visual preview (spec §6, §9).
 *
 * Output follows the DITA-OT 4.2.1 HTML5 tag and class contract, so DITA-OT stylesheets
 * (and users' previewCustomCss) style the page. Every element also carries
 * `data-dita` (its name), `data-class` (its effective @class) and `data-struct-id` (its
 * id in the current parse), which the page uses for breadcrumbs, problem marks and
 * source sync. Render-only attributes are never written back to the source.
 *
 * Dispatch: an element is rendered by the rule of its most specific class token that has
 * one (`hazard-d/hazardstatement` before `topic/note`), so a specialization — including
 * a project's own — renders like what it specializes. Elements with no class at all
 * render as labelled "unknown" boxes.
 *
 * Environment-neutral.
 */

import type { ElementIndex } from '../cst/elementIndex';
import { attr, childElements, findElementById, rawTextContent } from '../cst/query';
import { computeGrid, gridCellFor, isGridValid, type GridCell, type TableGrid } from '../cst/tableGrid';
import type { CstNode, Document, ElementNode, TextNode } from '../cst/types';
import { isElement } from '../cst/types';
import { basePlacement, classTokens, tokenElement } from '../grammar/classTokens';
import { findForeignRoot, renderForeign } from './foreign';
import { cssLength, decodeXmlText, escapeAttr, escapeHtml } from './html';
import { format, labelsFor, type Labels } from './labels';
import type { FilterDecision, FlagStyle, RenderOptions, RenderResult, Resolution } from './types';

interface Info {
    name: string;
    cls?: string;
    tokens: string[];
}

type Rule = (r: Renderer, el: ElementNode, info: Info) => string;

/** Start tags that may not appear inside an HTML <p> (the parser would close the <p>). */
const BLOCK_TAG = /<(?:div|p|ul|ol|dl|table|pre|figure|section|blockquote|nav|article|aside|h[1-6]|hr|details|header|footer|address|fieldset)[\s>]/i;

const ALIGN_VALUES = new Set(['left', 'right', 'center', 'justify']);
const IMAGE_ALIGN_VALUES = new Set(['left', 'center', 'right', 'current']);
const VALIGN_VALUES = new Set(['top', 'middle', 'bottom']);
const SEP_VALUES = new Set(['0', '1']);
const FIG_FRAME: Record<string, string> = {
    all: 'figborder', sides: 'figsides', top: 'figtop', bottom: 'figbottom', topbot: 'figtopbot', none: 'fignone',
};
const TM_MARK: Record<string, string> = { tm: '™', reg: '®', service: '℠' };
const NOTE_TYPES = new Set([
    'note', 'tip', 'fastpath', 'restriction', 'important', 'remember', 'attention', 'caution', 'notice',
    'danger', 'warning', 'trouble', 'other',
]);
const SECTION_LABELS = new Set([
    'prereq', 'context', 'result', 'postreq', 'tasktroubleshooting', 'condition', 'cause', 'remedy', 'responsibleParty',
]);

function presEnum(value: string | undefined, allowed: Set<string>): string | undefined {
    return value !== undefined && allowed.has(value) ? value : undefined;
}

function starWidth(value: string | undefined): number | null {
    const text = value?.trim();
    if (!text || !text.includes('*')) {
        return null;
    }
    const units = text.replace(/\*/g, '').trim();
    const parsed = units === '' ? 1 : Number(units);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function basename(href: string): string {
    return href.split(/[\\/]/).pop()?.replace(/[?#].*$/, '') ?? href;
}

function flagCss(flags: FlagStyle[]): string {
    const css: string[] = [];
    const deco = new Set<string>();
    for (const f of flags) {
        if (f.color) {
            css.push(`color:${f.color}`);
        }
        if (f.backcolor) {
            css.push(`background-color:${f.backcolor}`);
        }
        for (const s of (f.style ?? '').split(/\s+/).filter(Boolean)) {
            if (s === 'bold') {
                css.push('font-weight:bold');
            } else if (s === 'italics') {
                css.push('font-style:italic');
            } else if (s === 'underline' || s === 'double-underline') {
                deco.add('underline');
                if (s === 'double-underline') {
                    css.push('text-decoration-style:double');
                }
            } else if (s === 'overline' || s === 'line-through') {
                deco.add(s);
            }
        }
    }
    if (deco.size > 0) {
        css.push(`text-decoration-line:${[...deco].join(' ')}`);
    }
    // Colors come from a .ditaval file: keep only plausible CSS color tokens.
    return css.filter((c) => /^[a-z-]+:[#\w\s(),.%-]+$/i.test(c)).join(';');
}

// ---------------------------------------------------------------------------

/** Attributes of a reuse target as seen through the referencing element (DITA conref rules). */
const CONREF_ATTRIBUTES = new Set(['conref', 'conrefend', 'conkeyref', 'conaction', 'class']);

function mergeConrefAttrs(target: ElementNode, referencing: ElementNode): ElementNode['attrs'] {
    const merged = new Map(target.attrs.map((a) => [a.name, a]));
    for (const a of referencing.attrs) {
        if (!CONREF_ATTRIBUTES.has(a.name) && a.value !== '-dita-use-conref-target') {
            merged.set(a.name, a);
        }
    }
    return [...merged.values()];
}

/** A rendered stand-in for a reuse target: which element the author wrote, which one it reuses. */
interface Alias {
    ref: ElementNode;
    target: ElementNode;
}

class Renderer {
    readonly labels: Labels;
    readonly undeclared = new Set<string>();
    readonly unknown = new Set<string>();
    readonly footnotes: string[] = [];
    private readonly infoCache = new Map<ElementNode, Info>();
    private readonly decisions = new Map<ElementNode, FilterDecision>();
    private readonly numbers = new Map<ElementNode, number>();
    private readonly aliases = new Map<ElementNode, Alias>();
    /** Reused content being expanded (targets, children lists, ranges): stops reuse cycles. */
    private readonly expanding = new Set<object>();
    private readonly fnMarkers = new Map<ElementNode, string>();
    private readonly tableKeys = new Map<ElementNode, string>();
    /** Element ids of the rendered ancestors of the element being rendered. */
    private readonly idStack: string[] = [];
    private readonly ranks = new Map<string, number>();
    private fnSeq = 0;
    private preserve = 0;
    /** > 0 while rendering reused content, whose elements are not the document's own. */
    private inReuse = 0;
    /** Document whose source CDATA/comment ranges point into (switches inside reused content). */
    private doc: Document;
    /** Source path of reused content being rendered (undefined for the main document). */
    private sourcePath: string | undefined;

    constructor(mainDoc: Document, readonly opts: RenderOptions) {
        this.doc = mainDoc;
        this.labels = opts.labels ?? labelsFor('en');
        this.number(mainDoc.children);
    }

    // -- numbering ------------------------------------------------------------

    /**
     * Pre-pass so figure/table/equation numbers do not depend on render order (patches).
     * Reused content counts where it is reused. Footnotes are numbered as they render:
     * only a full render places them (see needsFullRender).
     */
    private number(nodes: CstNode[]): void {
        let fig = 0;
        let table = 0;
        let eq = 0;
        const active = new Set<object>();
        const visit = (list: CstNode[]): void => {
            if (active.has(list)) {
                return;
            }
            active.add(list);
            for (const node of list) {
                if (!isElement(node)) {
                    continue;
                }
                const res = this.opts.resolutions?.get(node);
                if (res?.conrefRange && !res.unresolved) {
                    visit(res.conrefRange);
                    continue;
                }
                const subject = res?.conrefTarget && !res.unresolved ? res.conrefTarget : node;
                const info = this.info(subject);
                const titled = this.childByToken(subject, 'topic/title') !== undefined;
                if (this.has(info, 'topic/fig') && titled) {
                    this.numbers.set(node, ++fig);
                } else if (this.has(info, 'topic/table') && titled) {
                    this.numbers.set(node, ++table);
                } else if (info.tokens.includes('equation-d/equation-number') && subject.children.every((c) => c.type === 'text' && c.raw.trim() === '')) {
                    this.numbers.set(node, ++eq);
                }
                visit(this.children(subject));
            }
            active.delete(list);
        };
        visit(nodes);
    }

    numberOf(el: ElementNode): number | undefined {
        return this.numbers.get(this.aliases.get(el)?.ref ?? el);
    }

    /** Marker of a footnote (its @callout, else the next number), registering its body once. */
    footnoteMarker(fn: ElementNode, referenced: boolean): string {
        let marker = this.fnMarkers.get(fn);
        if (marker === undefined) {
            marker = this.attrText(fn, 'callout') ?? String(++this.fnSeq);
            this.fnMarkers.set(fn, marker);
            const id = referenced ? this.structId(fn) : undefined;
            this.footnotes.push(`<div class="fn"${id ? ` data-struct-id="${id}"` : ''}><sup class="fnnum">${escapeHtml(marker)}</sup> ${this.kids(fn, true)}</div>`);
        }
        return marker;
    }

    /** The footnote an `<xref type="fn">` points at (same document), if any. */
    footnoteTarget(xref: ElementNode): ElementNode | undefined {
        const href = this.attrText(xref, 'href')?.trim() ?? '';
        if (!href.startsWith('#')) {
            return undefined;
        }
        const fragment = href.slice(1);
        const id = fragment.includes('/') ? fragment.slice(fragment.indexOf('/') + 1) : fragment;
        const target = id ? findElementById(this.doc.children, id) : undefined;
        return target && this.has(this.info(target), 'topic/fn') ? target : undefined;
    }

    /**
     * Header-id prefix of a table, unique on the page and identical in a full render and in
     * a patch: the table's element id, or — inside reused content, which has none — the
     * nearest rendered element id plus the table's rank under it.
     */
    tableKey(table: ElementNode): string {
        let key = this.tableKeys.get(table);
        if (key === undefined) {
            key = this.structId(table);
            if (key === undefined) {
                const owner = this.idStack[this.idStack.length - 1] ?? 'doc';
                const rank = this.ranks.get(owner) ?? 0;
                this.ranks.set(owner, rank + 1);
                key = `${owner}-r${rank}`;
            }
            this.tableKeys.set(table, key);
        }
        return key;
    }

    /** The document being traversed (the previewed one, or the source of reused content). */
    get currentDoc(): Document {
        return this.doc;
    }

    // -- element facts ----------------------------------------------------------

    info(el: ElementNode): Info {
        let info = this.infoCache.get(el);
        if (!info) {
            const cls = attr(el, 'class') ?? this.opts.classOf?.(el.name);
            // Without any class information, standard OASIS names still dispatch correctly.
            const tokens = cls ? classTokens(cls) : (FALLBACK_TOKENS.get(el.name) ?? []);
            info = { name: el.name, cls, tokens };
            this.infoCache.set(el, info);
        }
        return info;
    }

    has(info: Info, token: string): boolean {
        return info.tokens.includes(token);
    }

    /** Children as rendered: replacement children of a reference win over its own. */
    children(el: ElementNode): CstNode[] {
        const res = this.res(el);
        return (!res?.unresolved && res?.conrefChildren) || el.children;
    }

    childByToken(el: ElementNode, token: string): ElementNode | undefined {
        return this.children(el).find((c): c is ElementNode => isElement(c) && this.has(this.info(c), token));
    }

    childrenByToken(el: ElementNode, token: string): ElementNode[] {
        return this.children(el).filter((c): c is ElementNode => isElement(c) && this.has(this.info(c), token));
    }

    /** Number of topic ancestors (0 for the root topic). */
    topicDepth(el: ElementNode): number {
        let depth = 0;
        for (let p = el.parent; p; p = p.parent) {
            if (this.has(this.info(p), 'topic/topic')) {
                depth++;
            }
        }
        return depth;
    }

    /** Resolution of an element; a reuse stand-in has the resolution of the element it reuses. */
    res(el: ElementNode): Resolution | undefined {
        return this.opts.resolutions?.get(this.aliases.get(el)?.target ?? el);
    }

    /** `data-struct-id` of an element: a reuse stand-in has its referencing element's id. */
    structId(el: ElementNode): string | undefined {
        const alias = this.aliases.get(el);
        if (alias) {
            return this.opts.index?.idOf(alias.ref);
        }
        // Reused elements are not the document's own: they must not answer for its ids.
        return this.inReuse > 0 ? undefined : this.opts.index?.idOf(el);
    }

    attrText(el: ElementNode, name: string): string | undefined {
        const raw = attr(el, name);
        return raw === undefined ? undefined : decodeXmlText(raw, this.opts.entity);
    }

    // -- output helpers ---------------------------------------------------------

    /** Common attributes: classes (+ @outputclass), data-dita/class/struct-id, lang/dir, flags, resolution. */
    attrs(el: ElementNode, info: Info, classes: string, extra: Record<string, string | undefined> = {}, styles: string[] = []): string {
        let cl = classes;
        const outputclass = this.attrText(el, 'outputclass');
        if (outputclass) {
            cl += ` ${outputclass}`;
        }
        const decision = this.decisions.get(el);
        if (decision?.excluded) {
            cl += ' dc-excluded';
        }
        const css = [...styles];
        if (decision && decision.flags.length > 0) {
            cl += ' dc-flagged';
            const flagged = flagCss(decision.flags);
            if (flagged) {
                css.push(flagged);
            }
        }
        const alias = this.aliases.get(el);
        // A reuse stand-in shows the reuse (tooltip, Ctrl+click) — or the failure of the
        // reused element's own reference (a broken chain); its target's own resolution (a
        // keyref on the reused element, say) still drives its content.
        const own = this.res(el);
        const res = own?.unresolved ? own : (alias && this.opts.resolutions?.get(alias.ref)) || own;
        if (alias || (!res?.unresolved && (res?.conrefChildren || res?.conrefRange))) {
            cl += ' dc-conref';
        }
        if (res?.unresolved) {
            cl += ' dc-unresolved';
        }
        let out = ` class="${escapeAttr(cl.trim())}" data-dita="${escapeAttr(el.name)}"`;
        if (info.cls) {
            out += ` data-class="${escapeAttr(info.cls)}"`;
        }
        const id = this.structId(el);
        if (id) {
            out += ` data-struct-id="${id}"`;
        }
        const lang = attr(el, 'xml:lang');
        if (lang) {
            out += ` lang="${escapeAttr(lang)}"`;
        }
        const dir = presEnum(attr(el, 'dir'), new Set(['ltr', 'rtl']));
        if (dir) {
            out += ` dir="${dir}"`;
        }
        if (res) {
            out += this.resolutionAttrs(res);
        }
        for (const [name, value] of Object.entries(extra)) {
            if (value !== undefined) {
                out += ` ${name}="${escapeAttr(value)}"`;
            }
        }
        if (css.length > 0) {
            out += ` style="${escapeAttr(css.join(';'))}"`;
        }
        return out;
    }

    private resolutionAttrs(res: Resolution): string {
        let out = ` data-resolved="${res.kind}"`;
        if (res.key) {
            out += ` data-key="${escapeAttr(res.key)}"`;
        }
        if (res.from) {
            out += ` data-resolved-from="${escapeAttr(res.from)}"`;
        }
        if (res.path) {
            out += ` data-target="${escapeAttr(res.path + (res.fragment ? `#${res.fragment}` : ''))}"`;
        }
        const ui = this.labels.ui;
        let tip: string | undefined;
        if (res.unresolved) {
            tip = format(ui.unresolved, res.unresolved);
        } else if (res.from) {
            tip = `${format(ui.reusedFrom, res.from)} — ${ui.ctrlClickToOpen}`;
        } else if (res.key) {
            tip = `${format(ui.fromKey, res.key)} — ${ui.ctrlClickToOpen}`;
        }
        return tip ? `${out} title="${escapeAttr(tip)}"` : out;
    }

    wrap(tag: string, el: ElementNode, info: Info, classes: string, inner: string, extra?: Record<string, string | undefined>, styles?: string[]): string {
        return `<${tag}${this.attrs(el, info, classes, extra, styles)}>${inner}</${tag}>`;
    }

    // -- traversal --------------------------------------------------------------

    text(raw: string): string {
        const decoded = decodeXmlText(raw, this.opts.entity, (name) => this.undeclared.add(name));
        const html = escapeHtml(decoded);
        return this.preserve > 0 ? html : html.replace(/[ \t\r\n]+/g, ' ');
    }

    node(node: CstNode): string {
        switch (node.type) {
            case 'text':
                return this.text(node.raw);
            case 'cdata': {
                const inner = escapeHtml(this.doc.source.slice(node.range.start + 9, node.range.end - 3));
                return this.preserve > 0 ? inner : inner.replace(/[ \t\r\n]+/g, ' ');
            }
            case 'comment':
            case 'pi':
                if (!this.opts.showMarkup) {
                    return '';
                }
                return `<span class="dc-marker dc-${node.type}">${escapeHtml(this.doc.source.slice(node.range.start, node.range.end))}</span>`;
            case 'element':
                return this.element(node);
            default:
                return '';
        }
    }

    /** Children HTML; reused content replaces the element's own children. Block rules trim. */
    kids(el: ElementNode, trim = false, except?: ReadonlySet<ElementNode>): string {
        const res = this.res(el);
        const replaced = this.children(el);
        const reused = replaced !== el.children && !this.expanding.has(replaced) ? replaced : undefined;
        const nodes = reused ?? el.children;
        let html = '';
        const renderAll = (): void => {
            for (const node of nodes) {
                if (except && isElement(node) && except.has(node)) {
                    continue;
                }
                html += this.node(node);
            }
        };
        if (reused) {
            this.inReusedContent(reused, res!, renderAll);
        } else {
            renderAll();
        }
        const empty = !nodes.some((n) => n.type !== 'text' || n.raw.trim() !== '');
        if (empty && res?.text !== undefined) {
            html = escapeHtml(res.text);
        } else if (empty && res?.unresolved && res.key) {
            html = `<span class="dc-placeholder">[${escapeHtml(res.key)}]</span>`;
        }
        if (trim && this.preserve === 0) {
            html = html.replace(/^[ \t\r\n]+/, '').replace(/[ \t\r\n]+$/, '');
        }
        return html;
    }

    element(el: ElementNode): string {
        const res = this.res(el);
        if (res?.conrefTarget && !res.unresolved && !this.expanding.has(res.conrefTarget)) {
            return this.reused(el, res, res.conrefTarget);
        }
        const id = this.structId(el);
        if (id) {
            this.idStack.push(id);
        }
        try {
            return this.part(el, (info) => {
                if (res?.conrefRange && !res.unresolved && !this.expanding.has(res.conrefRange)) {
                    return this.conrefRange(el, info, res, res.conrefRange);
                }
                return this.ruleFor(el, info)(this, el, info);
            });
        } finally {
            if (id) {
                this.idStack.pop();
            }
        }
    }

    /** False when DITAVAL removes the element (excluded, and excluded content is not shown). */
    visible(el: ElementNode): boolean {
        const decision = this.opts.filter?.(el);
        return !(decision?.excluded && !this.opts.showExcluded);
    }

    /**
     * Render an element with DITAVAL applied: dropped when excluded, flagged (styles and
     * start/end markers) when flagged. Table parts rendered by their table's rule come
     * through here too. `markers: false` where text may not appear (between table cells).
     */
    part(el: ElementNode, render: (info: Info) => string, markers = true): string {
        const info = this.info(el);
        const decision = this.opts.filter?.(el);
        if (decision) {
            if (decision.excluded && !this.opts.showExcluded) {
                return '';
            }
            this.decisions.set(el, decision);
        }
        const preserves = attr(el, 'xml:space') === 'preserve' || this.has(info, 'topic/pre') || this.has(info, 'topic/lines');
        if (preserves) {
            this.preserve++;
        }
        try {
            let html = render(info);
            if (markers && html && decision && decision.flags.length > 0) {
                html = this.injectFlags(html, decision.flags);
            }
            return html;
        } finally {
            if (preserves) {
                this.preserve--;
            }
        }
    }

    /**
     * DITA reuse: the target element is rendered in place of the referencing one, with the
     * referencing element's attributes merged over the target's (so a reused table keeps its
     * frame, a reused image its href, and the author's own @id/@outputclass/profiling win).
     * The stand-in carries the referencing element's id, so sync and patches still work.
     */
    private reused(el: ElementNode, res: Resolution, target: ElementNode): string {
        const standIn: ElementNode = { ...target, attrs: mergeConrefAttrs(target, el), parent: el.parent };
        this.aliases.set(standIn, { ref: el, target });
        return this.inReusedContent(target, res, () => this.element(standIn));
    }

    /** Run `render` with the document, source path and reuse guard of reused content. */
    private inReusedContent<T>(key: object, res: Resolution, render: () => T): T {
        const prevDoc = this.doc;
        const prevPath = this.sourcePath;
        if (res.sourceDoc) {
            this.doc = res.sourceDoc;
            this.sourcePath = res.sourcePath;
        }
        this.expanding.add(key);
        this.inReuse++;
        try {
            return render();
        } finally {
            this.inReuse--;
            this.expanding.delete(key);
            this.doc = prevDoc;
            this.sourcePath = prevPath;
        }
    }

    private conrefRange(el: ElementNode, info: Info, res: Resolution, range: ElementNode[]): string {
        const inner = this.inReusedContent(range, res, () => range.map((e) => this.element(e)).join(''));
        const inline = basePlacement(info.cls) === 'inline';
        return this.wrap(inline ? 'span' : 'div', el, info, 'dc-conref-range', inner);
    }

    private injectFlags(html: string, flags: FlagStyle[]): string {
        const start = flags.map((f) => this.flagMarker(f.startImage, f.startText)).join('');
        const end = flags.map((f) => this.flagMarker(f.endImage, f.endText)).join('');
        if (!start && !end) {
            return html;
        }
        const openEnd = html.indexOf('>');
        const closeStart = html.lastIndexOf('</');
        if (openEnd === -1 || closeStart <= openEnd) {
            return start + html + end;
        }
        return html.slice(0, openEnd + 1) + start + html.slice(openEnd + 1, closeStart) + end + html.slice(closeStart);
    }

    private flagMarker(image: string | undefined, text: string | undefined): string {
        if (image) {
            return `<img class="dc-flag" src="${escapeAttr(image)}" alt="${escapeAttr(text ?? '')}">`;
        }
        return text ? `<span class="dc-flag">${escapeHtml(text)}</span>` : '';
    }

    private ruleFor(el: ElementNode, info: Info): Rule {
        for (let i = info.tokens.length - 1; i >= 0; i--) {
            const rule = RULES.get(info.tokens[i]);
            if (rule) {
                return rule;
            }
        }
        if (info.tokens.length === 0) {
            if (el.name === 'dita' && !el.parent) {
                return compositeRule; // DITA composite root: a container of topics, no @class
            }
            return unknownRule;
        }
        return genericRule;
    }

    imageSrc(href: string, el: ElementNode, absolute: boolean): string | undefined {
        if (!href) {
            return undefined;
        }
        if (this.opts.imageSrc) {
            return this.opts.imageSrc(href, el, absolute ? undefined : this.sourcePath);
        }
        return href;
    }

    /** Context for a title-like child whose parent consumed it (figcaption, caption…). */
    inlineChild(el: ElementNode, classes: string): string {
        return this.part(el, (info) => this.wrap('span', el, info, classes, this.kids(el, true)));
    }

    hidden(el: ElementNode, info: Info, label?: string): string {
        if (!this.opts.showMarkup) {
            return '';
        }
        const text = label ?? `${el.name}${rawTextContent(el).trim() ? `: ${decodeXmlText(rawTextContent(el), this.opts.entity).replace(/\s+/g, ' ').trim()}` : ''}`;
        return this.wrap('span', el, info, 'dc-marker', escapeHtml(text));
    }
}

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

const block = (classes: string, tag = 'div'): Rule => (r, el, info) =>
    r.wrap(tag, el, info, classes.replace('$name', el.name), r.kids(el, true));

const inline = (tag: string, classes: string): Rule => (r, el, info) =>
    r.wrap(tag, el, info, classes.replace('$name', el.name), r.kids(el));

/** A <p>-like block that falls back to <div> when it holds block content. */
const paragraph = (classes: string): Rule => (r, el, info) => {
    const inner = r.kids(el, true);
    return r.wrap(BLOCK_TAG.test(inner) ? 'div' : 'p', el, info, classes, inner);
};

const genericRule: Rule = (r, el, info) => {
    const placement = basePlacement(info.cls);
    return placement === 'block'
        ? r.wrap('div', el, info, el.name, r.kids(el, true))
        : r.wrap('span', el, info, el.name, r.kids(el));
};

const unknownRule: Rule = (r, el, info) => {
    r.unknown.add(el.name);
    const inner = r.kids(el, true);
    const blockish = BLOCK_TAG.test(inner) || !el.parent || (childElements(el).length > 0 && !hasText(el));
    const tag = blockish ? 'div' : 'span';
    return r.wrap(tag, el, info, `dc-unknown${blockish ? '' : ' dc-unknown-inline'}`, `<span class="dc-tag">${escapeHtml(el.name)}</span>${inner}`);
};

function hasText(el: ElementNode): boolean {
    return el.children.some((c) => c.type === 'text' && c.raw.trim() !== '');
}

const compositeRule: Rule = (r, el, info) => r.wrap('div', el, info, 'dita-composite', r.kids(el, true));

const hiddenRule: Rule = (r, el, info) => r.hidden(el, info);
const consumedRule: Rule = () => '';

const topicRule: Rule = (r, el, info) => {
    const depth = r.topicDepth(el);
    return r.wrap('article', el, info, `topic ${el.name} nested${depth}`, r.kids(el, true), { role: 'article' });
};

const titleRule: Rule = (r, el, info) => {
    const parent = el.parent;
    if (parent) {
        const pInfo = r.info(parent);
        if (r.has(pInfo, 'topic/topic')) {
            const level = Math.min(6, r.topicDepth(parent) + 1);
            return r.wrap(`h${level}`, el, info, `title topictitle${level}`, r.kids(el, true));
        }
        if (r.has(pInfo, 'topic/section') || r.has(pInfo, 'topic/example')) {
            // One level below the owning topic's title (topicDepth counts that topic).
            const level = Math.min(6, r.topicDepth(parent) + 1);
            return r.wrap(`h${level}`, el, info, 'title sectiontitle', r.kids(el, true));
        }
        if (r.has(pInfo, 'topic/fig') || r.has(pInfo, 'topic/table') || r.has(pInfo, 'topic/linklist')) {
            return ''; // rendered by the parent (figcaption / caption / list heading)
        }
    }
    return r.wrap('div', el, info, 'title', r.kids(el, true));
};

const shortdescRule: Rule = (r, el, info) => {
    if (el.parent && r.has(r.info(el.parent), 'topic/abstract')) {
        return r.wrap('span', el, info, 'shortdesc', r.kids(el, true));
    }
    return paragraph('shortdesc')(r, el, info);
};

const bodyRule: Rule = (r, el, info) =>
    r.wrap('div', el, info, el.name === 'body' ? 'body' : `body ${el.name}`, r.kids(el, true));

const sectionRule: Rule = (r, el, info) => {
    const specific = info.tokens.map(tokenElement).reverse().find((t) => SECTION_LABELS.has(t));
    let label = '';
    if (specific && !r.childByToken(el, 'topic/title')) {
        const level = Math.min(6, r.topicDepth(el) + 1);
        label = `<h${level} class="title sectiontitle tasklabel">${escapeHtml(r.labels.section[specific] ?? specific)}</h${level}>`;
    }
    const tag = r.has(info, 'topic/example') ? 'div' : 'section';
    const classes = r.has(info, 'topic/example') ? 'example' : `section${el.name === 'section' ? '' : ` ${el.name}`}`;
    return r.wrap(tag, el, info, classes, label + r.kids(el, true));
};

const noteRule: Rule = (r, el, info) => {
    const raw = r.attrText(el, 'type') ?? 'note';
    const type = NOTE_TYPES.has(raw) ? raw : 'note';
    const label = type === 'other' ? (r.attrText(el, 'othertype') ?? r.labels.note.other) : (r.labels.note[type] ?? r.labels.note.note);
    return r.wrap('div', el, info, `note note_${type}`, `<span class="note__title">${escapeHtml(label)}:</span> ${r.kids(el, true)}`, { 'data-type': type });
};

const hazardRule: Rule = (r, el, info) => {
    const type = r.attrText(el, 'type') ?? 'caution';
    const label = r.labels.hazard[type] ?? type.toUpperCase();
    return r.wrap('div', el, info, `note hazardstatement hazardstatement--${type}`,
        `<div class="hazardstatement--title"><span aria-hidden="true">⚠</span> ${escapeHtml(label)}</div>${r.kids(el, true)}`,
        { 'data-type': type });
};

const preRule: Rule = (r, el, info) => {
    const outputclass = r.attrText(el, 'outputclass') ?? '';
    const lang = /(?:^|\s)language-([\w+#.-]+)/.exec(outputclass)?.[1];
    const inner = r.kids(el);
    const body = el.name === 'codeblock' || r.has(info, 'pr-d/codeblock') ? `<code>${inner}</code>` : inner;
    return r.wrap('pre', el, info, `pre ${el.name}`, body, { 'data-lang': lang });
};

const linesRule: Rule = (r, el, info) => r.wrap('div', el, info, 'lines', r.kids(el));

const lqRule: Rule = (r, el, info) => {
    const refs = new Set(r.childrenByToken(el, 'topic/longquoteref'));
    const reftitle = r.attrText(el, 'reftitle');
    const source = reftitle ? `<footer class="lq-source">— ${escapeHtml(reftitle)}</footer>` : '';
    return r.wrap('blockquote', el, info, 'lq', r.kids(el, true, refs) + source);
};

const figRule: Rule = (r, el, info) => {
    const title = r.childByToken(el, 'topic/title');
    const desc = r.childByToken(el, 'topic/desc');
    const consumed = new Set([title, desc].filter((e): e is ElementNode => e !== undefined));
    let caption = '';
    if (title || desc) {
        const n = r.numberOf(el);
        const label = title && n !== undefined ? `<span class="fig--title-label">${escapeHtml(format(r.labels.figure, n))}</span>` : '';
        caption = `<figcaption>${label}${title ? r.inlineChild(title, 'fig--title') : ''}${desc ? ` ${r.inlineChild(desc, 'desc figdesc')}` : ''}</figcaption>`;
    }
    const frame = FIG_FRAME[r.attrText(el, 'frame') ?? 'none'] ?? 'fignone';
    return r.wrap('figure', el, info, `fig ${frame}`, caption + r.kids(el, true, consumed));
};

const figgroupRule: Rule = (r, el, info) => {
    const title = r.childByToken(el, 'topic/title');
    const consumed = new Set(title ? [title] : []);
    const heading = title ? r.part(title, (titleInfo) => r.wrap('div', title, titleInfo, 'title figgroup--title', r.kids(title, true))) : '';
    return r.wrap('div', el, info, 'figgroup', heading + r.kids(el, true, consumed));
};

const imageRule: Rule = (r, el, info) => {
    const res = r.res(el);
    // Only a key resolves to the image file itself (a conref's path is the reused topic).
    const keyPath = res?.kind === 'key' && !res.unresolved ? res.path : undefined;
    const href = keyPath ?? r.attrText(el, 'href') ?? '';
    const src = href ? r.imageSrc(href, el, keyPath !== undefined) : undefined;
    const altEl = r.childByToken(el, 'topic/alt');
    const alt = altEl
        ? decodeXmlText(rawTextContent(altEl), r.opts.entity).replace(/\s+/g, ' ').trim()
        : r.attrText(el, 'alt') ?? (href ? basename(href) : '');
    const styles: string[] = [];
    const width = cssLength(r.attrText(el, 'width'));
    const height = cssLength(r.attrText(el, 'height'));
    if (width) {
        styles.push(`width:${width}`);
    }
    if (height) {
        styles.push(`height:${height}`);
    }
    if (!width && !height && r.attrText(el, 'scalefit') === 'yes') {
        styles.push('max-width:100%');
    }
    const scale = r.attrText(el, 'scale');
    const breakLine = r.attrText(el, 'placement') === 'break';
    const align = breakLine ? presEnum(r.attrText(el, 'align'), IMAGE_ALIGN_VALUES) : undefined;
    let html: string;
    if (src) {
        html = `<img${r.attrs(el, info, `image${align ? ` image${align}` : ''}`, {
            src, alt, 'data-scale': scale && /^\d+$/.test(scale) ? scale : undefined, loading: 'lazy',
        }, styles)}>`;
    } else {
        html = r.wrap('span', el, info, 'image dc-missing-image', escapeHtml(alt || href || el.name), { role: 'img', 'aria-label': alt || undefined });
    }
    return breakLine ? `<div class="image-break${align ? ` image${align}` : ''}">${html}</div>` : html;
};

const objectRule: Rule = (r, el, info) => {
    const desc = r.childByToken(el, 'topic/desc');
    const label = r.attrText(el, 'data') ?? r.attrText(el, 'type') ?? el.name;
    return r.wrap('div', el, info, 'object dc-object',
        `<span class="dc-tag">${escapeHtml(el.name)}</span> ${escapeHtml(label)}${desc ? ` ${r.inlineChild(desc, 'desc')}` : ''}`);
};

const foreignRule: Rule = (r, el, info) => {
    const res = r.res(el);
    let content = '';
    if (res?.foreignRoot && res.sourceDoc) {
        content = renderForeign(res.foreignRoot, res.sourceDoc, r.opts.entity);
    } else {
        for (const child of childElements(el)) {
            const cRes = r.res(child);
            if (cRes?.foreignRoot && cRes.sourceDoc) {
                content += renderForeign(cRes.foreignRoot, cRes.sourceDoc, r.opts.entity);
                continue;
            }
            const root = findForeignRoot(child);
            if (root) {
                content += renderForeign(root, r.currentDoc, r.opts.entity);
            } else if (r.has(r.info(child), 'topic/desc')) {
                continue;
            } else {
                content += r.element(child);
            }
        }
    }
    if (!content.trim()) {
        return r.wrap('span', el, info, `${el.name} dc-unknown dc-unknown-inline`, `<span class="dc-tag">${escapeHtml(el.name)}</span>`);
    }
    return r.wrap('span', el, info, el.name, content);
};

const draftRule: Rule = (r, el, info) => {
    if (!r.opts.showMarkup) {
        return '';
    }
    const who = [r.attrText(el, 'author'), r.attrText(el, 'time'), r.attrText(el, 'disposition')].filter(Boolean).join(', ');
    const head = `<span class="dc-marker-label">${escapeHtml(el.name)}${who ? ` (${escapeHtml(who)})` : ''}</span> `;
    return r.wrap('div', el, info, `${el.name} dc-markup`, head + r.kids(el, true));
};

const dataRule: Rule = (r, el, info) => {
    const name = r.attrText(el, 'name');
    const value = r.attrText(el, 'value');
    const text = decodeXmlText(rawTextContent(el), r.opts.entity).replace(/\s+/g, ' ').trim();
    const label = [name, value ?? (text || undefined)].filter(Boolean).join(' = ') || el.name;
    return r.hidden(el, info, `◇ ${label}`);
};

const indextermRule: Rule = (r, el, info) =>
    r.hidden(el, info, `⌖ ${decodeXmlText(rawTextContent(el), r.opts.entity).replace(/\s+/g, ' ').trim()}`);

const fnRule: Rule = (r, el, info) => {
    if (attr(el, 'id')) {
        return ''; // numbered and listed where an <xref type="fn"> references it
    }
    return r.wrap('sup', el, info, 'fn', escapeHtml(r.footnoteMarker(el, false)));
};

const xrefRule: Rule = (r, el, info) => {
    if (r.attrText(el, 'type') === 'fn') {
        const fn = r.footnoteTarget(el);
        if (fn) {
            return r.wrap('sup', el, info, 'fn', escapeHtml(r.footnoteMarker(fn, true)));
        }
    }
    const href = r.attrText(el, 'href');
    const scope = r.attrText(el, 'scope');
    const descs = new Set(r.childrenByToken(el, 'topic/desc'));
    const descText = [...descs].map((d) => decodeXmlText(rawTextContent(d), r.opts.entity).replace(/\s+/g, ' ').trim()).join(' ');
    let inner = r.kids(el, false, descs);
    if (!inner.trim()) {
        const res = r.res(el);
        inner = res?.text !== undefined ? escapeHtml(res.text)
            : res?.unresolved && res.key ? `<span class="dc-placeholder">[${escapeHtml(res.key)}]</span>`
                : escapeHtml(href ?? r.attrText(el, 'keyref') ?? '');
    }
    // A URI scheme has 2+ characters, so a Windows path (C:\…) is not external.
    const external = scope === 'external' || (/^[a-z][\w+.-]+:/i.test(href ?? '') && !/^file:/i.test(href ?? ''));
    const res = r.res(el);
    return r.wrap('a', el, info, `xref${external ? ' dc-external' : ''}`, inner, {
        'data-href': href,
        'data-scope': scope,
        'data-keyref': r.attrText(el, 'keyref'),
        title: res ? undefined : (descText || r.labels.ui.ctrlClickToOpen),
    });
};

const linkRule: Rule = (r, el, info) => {
    const linktext = r.childByToken(el, 'topic/linktext');
    const desc = r.childByToken(el, 'topic/desc');
    const res = r.res(el);
    const href = r.attrText(el, 'href');
    const text = linktext ? r.kids(linktext, true)
        : res?.text !== undefined ? escapeHtml(res.text) : escapeHtml(href ?? r.attrText(el, 'keyref') ?? '');
    const anchor = `<a class="link" data-href="${escapeAttr(href ?? '')}"${r.attrText(el, 'scope') ? ` data-scope="${escapeAttr(r.attrText(el, 'scope')!)}"` : ''}>${text}</a>`;
    return r.wrap('li', el, info, 'link ulchildlink', anchor + (desc ? `<div class="shortdesc">${r.kids(desc, true)}</div>` : ''));
};

const relatedLinksRule: Rule = (r, el, info) => {
    const inner = r.kids(el, true);
    if (!inner.trim()) {
        return '';
    }
    return r.wrap('nav', el, info, 'related-links',
        `<div class="linklist relinfo"><strong>${escapeHtml(r.labels.relatedInformation)}</strong><ul class="linklist">${inner}</ul></div>`,
        { role: 'navigation' });
};

const linkpoolRule: Rule = (r, el) => r.kids(el, true);

const linklistRule: Rule = (r, el, info) => {
    const title = r.childByToken(el, 'topic/title');
    const heading = title ? `<strong>${r.kids(title, true)}</strong>` : '';
    return r.wrap('li', el, info, 'linklist', `${heading}<ul class="linklist">${r.kids(el, true, new Set(title ? [title] : []))}</ul>`);
};

const prologRule: Rule = (r, el, info) => {
    if (!r.opts.showMarkup) {
        return '';
    }
    return r.wrap('div', el, info, `${el.name} dc-markup`, `<span class="dc-marker-label">${escapeHtml(el.name)}</span>${metaRows(r, el)}`);
};

function metaRows(r: Renderer, el: ElementNode): string {
    let out = '';
    for (const child of childElements(el)) {
        const attrs = child.attrs
            .filter((a) => !['class', 'xmlns:ditaarch', 'ditaarch:DITAArchVersion', 'domains'].includes(a.name))
            .map((a) => `${a.name}="${decodeXmlText(a.value, r.opts.entity)}"`)
            .join(' ');
        const own = child.children.filter((c): c is TextNode => c.type === 'text').map((c) => c.raw).join('');
        const text = decodeXmlText(own, r.opts.entity).replace(/\s+/g, ' ').trim();
        const nested = childElements(child).length > 0 ? `<div class="dc-meta-nested">${metaRows(r, child)}</div>` : '';
        const id = r.structId(child);
        out += `<div class="dc-meta"${id ? ` data-struct-id="${id}"` : ''} data-dita="${escapeAttr(child.name)}">`
            + `<span class="dc-meta-name">${escapeHtml(child.name)}</span>`
            + (attrs ? ` <span class="dc-meta-attrs">${escapeHtml(attrs)}</span>` : '')
            + (text ? ` ${escapeHtml(text)}` : '')
            + `${nested}</div>`;
    }
    return out;
}

const ulRule: Rule = (r, el, info) => r.wrap('ul', el, info, el.name === 'ul' ? 'ul' : `ul ${el.name}`, r.kids(el, true));
const olRule: Rule = (r, el, info) => r.wrap('ol', el, info, el.name === 'ol' ? 'ol' : `ol ${el.name}`, r.kids(el, true));
const liRule: Rule = (r, el, info) => r.wrap('li', el, info, el.name === 'li' ? 'li' : `li ${el.name}`, r.kids(el, true));

const stepsRule: Rule = (r, el, info) => r.wrap('ol', el, info, `ol ${el.name}`, r.kids(el, true));
const substepsRule: Rule = (r, el, info) => r.wrap('ol', el, info, `ol ${el.name}`, r.kids(el, true), { type: 'a' });
const stepsUnorderedRule: Rule = (r, el, info) => r.wrap('ul', el, info, `ul ${el.name}`, r.kids(el, true));

const stepRule: Rule = (r, el, info) => {
    const importance = r.attrText(el, 'importance');
    const prefix = importance === 'optional' ? r.labels.optional : importance === 'required' ? r.labels.required : '';
    const lead = prefix ? `<span class="step__importance">${escapeHtml(prefix)}</span>` : '';
    return r.wrap('li', el, info, `li ${el.name}${el.name === 'step' ? ' stepexpand' : ''}`, lead + r.kids(el, true));
};

const itemgroupRule: Rule = (r, el, info) => {
    const label = el.name === 'steptroubleshooting' ? `<span class="tasklabel">${escapeHtml(r.labels.section.steptroubleshooting)}</span> ` : '';
    return r.wrap('div', el, info, `itemgroup ${el.name}`, label + r.kids(el, true));
};

const dlRule: Rule = (r, el, info) => r.wrap('dl', el, info, el.name, r.kids(el, true));
const dlentryRule: Rule = (r, el, info) => r.wrap('div', el, info, el.name, r.kids(el, true));
const dtRule: Rule = (r, el, info) => r.wrap('dt', el, info, `${el.name} dlterm`, r.kids(el, true));
const ddRule: Rule = (r, el, info) => r.wrap('dd', el, info, el.name, r.kids(el, true));

const termRule: Rule = (r, el, info) => r.wrap('dfn', el, info, el.name === 'term' ? 'term' : `term ${el.name}`, r.kids(el));

const tmRule: Rule = (r, el, info) => {
    const mark = TM_MARK[r.attrText(el, 'tmtype') ?? 'tm'] ?? '™';
    return r.wrap('span', el, info, 'tm', `${r.kids(el)}<span class="tmmark">${mark}</span>`);
};

const booleanRule: Rule = (r, el, info) => r.wrap('span', el, info, 'boolean', escapeHtml(r.attrText(el, 'state') ?? ''));

const stateRule: Rule = (r, el, info) =>
    r.wrap('span', el, info, 'state', escapeHtml(`${r.attrText(el, 'name') ?? ''}=${r.attrText(el, 'value') ?? ''}`));

const menucascadeRule: Rule = (r, el, info) => {
    const parts = r.children(el).filter(isElement).map((c) => r.element(c)).filter((h) => h !== '');
    return r.wrap('span', el, info, 'ph menucascade', parts.join('<abbr title="and then" class="menucascade__separator"> &gt; </abbr>'));
};

const markupRule = (before: string, after: string, classes: string): Rule => (r, el, info) =>
    r.wrap('code', el, info, classes, `${escapeHtml(before)}${r.kids(el)}${escapeHtml(after)}`);

const coderefRule: Rule = (r, el, info) => {
    const res = r.res(el);
    if (res?.text !== undefined) {
        return r.wrap('span', el, info, 'coderef', escapeHtml(res.text));
    }
    return r.wrap('span', el, info, 'coderef dc-placeholder', escapeHtml(`[${r.attrText(el, 'href') ?? 'coderef'}]`));
};

const equationNumberRule: Rule = (r, el, info) => {
    const n = r.numberOf(el);
    return r.wrap('span', el, info, 'equation-number', n !== undefined ? `(${n})` : r.kids(el));
};

const abbreviatedFormRule: Rule = (r, el, info) => r.wrap('span', el, info, 'abbreviated-form', r.kids(el));

// -- tables (CALS) -------------------------------------------------------------

interface TablePresentation {
    cols: number;
    colAlign: Map<number, string>;
    colColsep: Map<number, string>;
    colRowsep: Map<number, string>;
    defColsep?: string;
    defRowsep?: string;
    defAlign?: string;
}

const tableRule: Rule = (r, el, info) => {
    const title = r.childByToken(el, 'topic/title');
    const desc = r.childByToken(el, 'topic/desc');
    const frame = presEnum(r.attrText(el, 'frame'), new Set(['top', 'bottom', 'topbot', 'all', 'sides', 'none']));
    const classes = `table${frame ? ` frame-${frame}` : ''}`;
    let caption = '';
    if (title || desc) {
        const n = r.numberOf(el);
        const label = title && n !== undefined ? `<span class="table--title-label">${escapeHtml(format(r.labels.table, n))}</span>` : '';
        caption = `<caption>${label}${title ? r.inlineChild(title, 'title') : ''}${desc ? ` ${r.inlineChild(desc, 'desc tabledesc')}` : ''}</caption>`;
    }
    const tgroups = r.childrenByToken(el, 'topic/tgroup');
    if (tgroups.length === 0) {
        return r.wrap('table', el, info, classes, caption);
    }
    let html = `<table${r.attrs(el, info, classes)}>${caption}`;
    tgroups.forEach((tgroup, i) => {
        html += r.part(tgroup, () => renderTgroup(r, el, tgroup, i), false);
    });
    return `${html}</table>`;
};

function renderTgroup(r: Renderer, table: ElementNode, tgroup: ElementNode, tgroupIndex: number): string {
    const first = tgroupIndex === 0;
    const colspecs = r.childrenByToken(tgroup, 'topic/colspec');
    const stars = colspecs.map((cs) => starWidth(r.attrText(cs, 'colwidth')));
    const starTotal = stars.reduce<number>((s, v) => s + (v ?? 0), 0);
    const cols = colspecs.map((cs, i) => {
        const raw = r.attrText(cs, 'colwidth')?.trim() ?? '';
        const star = stars[i];
        if (star !== null && starTotal > 0) {
            return `<col style="width:${((star / starTotal) * 100).toFixed(2)}%">`;
        }
        const fixed = raw && !raw.includes('*') ? cssLength(raw.replace(/pi$/, 'pc')) : undefined;
        return fixed ? `<col style="width:${fixed}">` : '<col>';
    }).join('');
    const colgroup = cols && first ? `<colgroup>${cols}</colgroup>` : '';

    const pres = presentation(r, table, tgroup, colspecs);
    let grid: TableGrid | null = null;
    try {
        grid = computeGrid(tgroup);
    } catch {
        grid = null;
    }
    const headers = grid && isGridValid(grid) ? headerIds(grid, `dch-${r.tableKey(table)}-${tgroupIndex}`) : null;
    const rowheader = r.attrText(table, 'rowheader') === 'firstcol';
    let html = colgroup;
    const thead = r.childByToken(tgroup, 'topic/thead');
    const tbody = r.childByToken(tgroup, 'topic/tbody');
    if (thead) {
        html += r.part(thead, (info) => r.wrap('thead', thead, info, 'thead', rows(r, thead, true, grid, headers, pres, rowheader)), false);
    }
    if (tbody) {
        html += r.part(tbody, (info) => r.wrap('tbody', tbody, info, 'tbody', rows(r, tbody, false, grid, headers, pres, rowheader)), false);
    }
    return html;
}

function presentation(r: Renderer, table: ElementNode, tgroup: ElementNode, colspecs: ElementNode[]): TablePresentation {
    const colAlign = new Map<number, string>();
    const colColsep = new Map<number, string>();
    const colRowsep = new Map<number, string>();
    colspecs.forEach((cs, i) => {
        const num = Number(r.attrText(cs, 'colnum') ?? String(i + 1)) || i + 1;
        const align = presEnum(r.attrText(cs, 'align'), ALIGN_VALUES);
        const colsep = presEnum(r.attrText(cs, 'colsep'), SEP_VALUES);
        const rowsep = presEnum(r.attrText(cs, 'rowsep'), SEP_VALUES);
        if (align) {
            colAlign.set(num, align);
        }
        if (colsep) {
            colColsep.set(num, colsep);
        }
        if (rowsep) {
            colRowsep.set(num, rowsep);
        }
    });
    return {
        cols: Number(r.attrText(tgroup, 'cols') ?? '0') || colspecs.length,
        colAlign,
        colColsep,
        colRowsep,
        defColsep: presEnum(r.attrText(tgroup, 'colsep'), SEP_VALUES) ?? presEnum(r.attrText(table, 'colsep'), SEP_VALUES),
        defRowsep: presEnum(r.attrText(tgroup, 'rowsep'), SEP_VALUES) ?? presEnum(r.attrText(table, 'rowsep'), SEP_VALUES),
        defAlign: presEnum(r.attrText(tgroup, 'align'), ALIGN_VALUES),
    };
}

interface HeaderIds {
    cellOf: Map<ElementNode, GridCell>;
    idOf: Map<ElementNode, string>;
    scopeOf: Map<ElementNode, string>;
    byColumn: Map<number, string[]>;
}

/**
 * Span-aware header association (WCAG H43): thead cells get ids, body cells headers=.
 * Ids are `<prefix>-<n>`, the prefix naming the table (Renderer.tableKey), so they are unique
 * on the page and a patched table keeps the ids it had.
 */
function headerIds(grid: TableGrid, prefix: string): HeaderIds | null {
    const heads = grid.cells.filter((c) => c.section === 'thead').sort((a, b) => a.row - b.row || a.colStart - b.colStart);
    if (heads.length === 0) {
        return null;
    }
    const cellOf = new Map<ElementNode, GridCell>();
    for (const c of grid.cells) {
        cellOf.set(c.entry, c);
    }
    const idOf = new Map<ElementNode, string>();
    const scopeOf = new Map<ElementNode, string>();
    const byColumn = new Map<number, string[]>();
    for (const [n, h] of heads.entries()) {
        const id = `${prefix}-${n}`;
        idOf.set(h.entry, id);
        scopeOf.set(h.entry, h.colStart === h.colEnd ? 'col' : 'colgroup');
        for (let col = h.colStart; col <= h.colEnd; col++) {
            byColumn.set(col, [...(byColumn.get(col) ?? []), id]);
        }
    }
    return { cellOf, idOf, scopeOf, byColumn };
}

function rows(r: Renderer, section: ElementNode, isHead: boolean, grid: TableGrid | null, headers: HeaderIds | null, pres: TablePresentation, rowheader: boolean): string {
    // Rows filtered out by DITAVAL are left out first: the last remaining row draws no separator.
    const rowEls = r.childrenByToken(section, 'topic/row').filter((row) => r.visible(row));
    return rowEls.map((row, ri) => r.part(row, (info) => {
        const lastBodyRow = !isHead && ri === rowEls.length - 1;
        const rowRowsep = presEnum(r.attrText(row, 'rowsep'), SEP_VALUES);
        const extra = { 'data-rowsep': rowRowsep && !lastBodyRow ? rowRowsep : undefined };
        const cells = r.childrenByToken(row, 'topic/entry')
            .map((entry, i) => r.part(entry, (entryInfo) => cell(r, entry, entryInfo, row, isHead, grid, headers, pres, lastBodyRow, i, rowheader)))
            .join('');
        return r.wrap('tr', row, info, 'row', cells, extra);
    }, false)).join('');
}

function cell(
    r: Renderer, entry: ElementNode, info: Info, row: ElementNode, isHead: boolean, grid: TableGrid | null,
    headers: HeaderIds | null, pres: TablePresentation, lastBodyRow: boolean, indexInRow: number, rowheader: boolean,
): string {
    const gc = grid ? gridCellFor(grid, entry) : undefined;
    const colStart = gc ? gc.colStart : indexInRow + 1;
    const colEnd = gc ? gc.colEnd : colStart;
    const asHeader = isHead || (rowheader && colStart === 1);
    const extra: Record<string, string | undefined> = {};
    const colspan = colEnd - colStart + 1;
    if (colspan > 1) {
        extra.colspan = String(colspan);
    }
    const rowspan = gc?.rowSpan ?? ((Number(r.attrText(entry, 'morerows')) || 0) + 1);
    if (rowspan > 1) {
        extra.rowspan = String(rowspan);
    }
    if (headers) {
        if (isHead) {
            extra.id = headers.idOf.get(entry);
            extra.scope = headers.scopeOf.get(entry);
        } else if (gc) {
            const ids: string[] = [];
            for (let col = gc.colStart; col <= gc.colEnd; col++) {
                for (const hid of headers.byColumn.get(col) ?? []) {
                    if (!ids.includes(hid)) {
                        ids.push(hid);
                    }
                }
            }
            if (ids.length > 0) {
                extra.headers = ids.join(' ');
            }
        }
    } else if (asHeader && !isHead) {
        extra.scope = 'row';
    }

    const colsep = presEnum(r.attrText(entry, 'colsep'), SEP_VALUES) ?? pres.colColsep.get(colEnd) ?? pres.defColsep;
    if (colsep && colEnd !== pres.cols) {
        extra['data-colsep'] = colsep;
    }
    const rowsep = presEnum(r.attrText(entry, 'rowsep'), SEP_VALUES)
        ?? presEnum(r.attrText(row, 'rowsep'), SEP_VALUES) ?? pres.colRowsep.get(colStart) ?? pres.defRowsep;
    if (rowsep && !lastBodyRow) {
        extra['data-rowsep'] = rowsep;
    }
    const styles: string[] = [];
    const align = presEnum(r.attrText(entry, 'align'), ALIGN_VALUES) ?? pres.colAlign.get(colStart) ?? pres.defAlign;
    if (align) {
        styles.push(`text-align:${align}`);
    }
    const valign = presEnum(r.attrText(entry, 'valign'), VALIGN_VALUES) ?? presEnum(r.attrText(row, 'valign'), VALIGN_VALUES);
    if (valign) {
        styles.push(`vertical-align:${valign}`);
    }
    const tag = asHeader ? 'th' : 'td';
    return r.wrap(tag, entry, info, 'entry', r.kids(entry, true), extra, styles);
}

// -- simple tables ----------------------------------------------------------------

const simpletableRule: Rule = (r, el, info) => {
    const keycol = Number(r.attrText(el, 'keycol') ?? '0') || 0;
    const rel = (r.attrText(el, 'relcolwidth') ?? '').trim().split(/\s+/).map(starWidth);
    const total = rel.reduce<number>((s, v) => s + (v ?? 0), 0);
    const colgroup = total > 0 ? `<colgroup>${rel.map((v) => `<col style="width:${(((v ?? 0) / total) * 100).toFixed(2)}%">`).join('')}</colgroup>` : '';
    const title = r.childByToken(el, 'topic/title');
    const caption = title ? `<caption>${r.inlineChild(title, 'title')}</caption>` : '';
    const head = r.childByToken(el, 'topic/sthead');
    const bodyRows = r.childrenByToken(el, 'topic/strow');
    let thead = '';
    if (head) {
        const row = r.part(head, (headInfo) => r.wrap('tr', head, headInfo, 'sthead', stCells(r, head, true, keycol)), false);
        thead = row ? `<thead>${row}</thead>` : '';
    } else {
        const generated = generatedHeader(r, info, bodyRows);
        thead = generated ? `<thead><tr class="sthead dc-generated">${generated}</tr></thead>` : '';
    }
    const tbody = `<tbody>${bodyRows.map((row) => r.part(row, (rowInfo) => r.wrap('tr', row, rowInfo, 'strow', stCells(r, row, false, keycol)), false)).join('')}</tbody>`;
    return r.wrap('table', el, info, `simpletable ${el.name}`, caption + colgroup + thead + tbody);
};

/** Choicetable and properties tables get localized column headers when they have none. */
function generatedHeader(r: Renderer, info: Info, bodyRows: ElementNode[]): string {
    if (r.has(info, 'task/choicetable')) {
        return `<th scope="col">${escapeHtml(r.labels.option)}</th><th scope="col">${escapeHtml(r.labels.description)}</th>`;
    }
    if (r.has(info, 'reference/properties')) {
        const present = (name: string) => bodyRows.some((row) => childElements(row).some((c) => c.name === name || r.has(r.info(c), `reference/${name}`)));
        const cols: string[] = [];
        if (present('proptype')) {
            cols.push(r.labels.type);
        }
        if (present('propvalue')) {
            cols.push(r.labels.value);
        }
        if (present('propdesc')) {
            cols.push(r.labels.description);
        }
        return cols.map((c) => `<th scope="col">${escapeHtml(c)}</th>`).join('');
    }
    return '';
}

function stCells(r: Renderer, row: ElementNode, isHead: boolean, keycol: number): string {
    return r.childrenByToken(row, 'topic/stentry').map((entry, i) => r.part(entry, (info) => {
        const key = !isHead && keycol === i + 1;
        const tag = isHead || key ? 'th' : 'td';
        const extra = { scope: isHead ? 'col' : key ? 'row' : undefined };
        return r.wrap(tag, entry, info, `stentry ${entry.name === 'stentry' ? '' : entry.name}`.trim(), r.kids(entry, true), extra);
    })).join('');
}

// -- rule table ---------------------------------------------------------------------

const RULES = new Map<string, Rule>([
    // structure
    ['topic/topic', topicRule],
    ['topic/title', titleRule],
    ['topic/titlealts', prologRule],
    ['topic/shortdesc', shortdescRule],
    ['topic/abstract', block('abstract')],
    ['topic/prolog', prologRule],
    ['topic/body', bodyRule],
    ['topic/bodydiv', block('bodydiv')],
    ['topic/section', sectionRule],
    ['topic/example', sectionRule],
    ['topic/sectiondiv', block('sectiondiv')],
    ['topic/related-links', relatedLinksRule],
    ['topic/linkpool', linkpoolRule],
    ['topic/linklist', linklistRule],
    ['topic/link', linkRule],
    ['topic/linktext', consumedRule],
    ['topic/linkinfo', block('linkinfo')],
    ['topic/desc', block('desc')],
    ['topic/no-topic-nesting', consumedRule],
    // blocks
    ['topic/p', paragraph('p')],
    ['topic/note', noteRule],
    ['hazard-d/hazardstatement', hazardRule],
    ['hazard-d/messagepanel', block('messagepanel')],
    ['hazard-d/typeofhazard', block('typeofhazard')],
    ['hazard-d/consequence', block('consequence')],
    ['hazard-d/howtoavoid', block('howtoavoid')],
    ['topic/pre', preRule],
    ['topic/lines', linesRule],
    ['topic/lq', lqRule],
    ['topic/longquoteref', consumedRule],
    ['topic/fig', figRule],
    ['topic/figgroup', figgroupRule],
    ['topic/image', imageRule],
    ['topic/alt', consumedRule],
    ['topic/longdescref', consumedRule],
    ['topic/object', objectRule],
    ['topic/param', consumedRule],
    ['topic/foreign', foreignRule],
    ['topic/unknown', foreignRule],
    ['topic/draft-comment', draftRule],
    ['topic/required-cleanup', draftRule],
    ['topic/data', dataRule],
    ['topic/data-about', dataRule],
    ['topic/sort-as', hiddenRule],
    ['topic/indexterm', indextermRule],
    ['topic/index-base', hiddenRule],
    ['topic/indextermref', hiddenRule],
    ['topic/fn', fnRule],
    ['topic/div', block('div')],
    // lists
    ['topic/ul', ulRule],
    ['topic/ol', olRule],
    ['topic/li', liRule],
    ['topic/sl', block('sl simple', 'ul')],
    ['topic/sli', block('sli', 'li')],
    ['topic/dl', dlRule],
    ['topic/dlentry', dlentryRule],
    ['topic/dlhead', dlentryRule],
    ['topic/dt', dtRule],
    ['topic/dthd', dtRule],
    ['topic/dd', ddRule],
    ['topic/ddhd', ddRule],
    ['topic/itemgroup', itemgroupRule],
    // tables
    ['topic/table', tableRule],
    ['topic/simpletable', simpletableRule],
    // inline
    ['topic/ph', inline('span', 'ph')],
    ['topic/keyword', inline('span', 'keyword')],
    ['topic/term', termRule],
    ['topic/text', inline('span', 'text')],
    ['topic/tm', tmRule],
    ['topic/cite', inline('cite', 'cite')],
    ['topic/q', inline('q', 'q')],
    ['topic/boolean', booleanRule],
    ['topic/state', stateRule],
    ['topic/xref', xrefRule],
    ['hi-d/b', inline('strong', 'ph b')],
    ['hi-d/i', inline('em', 'ph i')],
    ['hi-d/u', inline('u', 'ph u')],
    ['hi-d/tt', inline('span', 'ph tt')],
    ['hi-d/sup', inline('sup', 'ph sup')],
    ['hi-d/sub', inline('sub', 'ph sub')],
    ['hi-d/line-through', inline('span', 'ph line-through')],
    ['hi-d/overline', inline('span', 'ph overline')],
    // programming
    ['pr-d/codeph', inline('code', 'ph codeph')],
    ['pr-d/codeblock', preRule],
    ['pr-d/coderef', coderefRule],
    ['pr-d/var', inline('var', 'ph var')],
    ['pr-d/synph', inline('span', 'ph synph')],
    ['pr-d/apiname', inline('code', 'keyword apiname')],
    ['pr-d/option', inline('code', 'keyword option')],
    ['pr-d/parmname', inline('code', 'keyword parmname')],
    ['pr-d/kwd', inline('code', 'keyword kwd')],
    ['pr-d/parml', dlRule],
    ['pr-d/plentry', dlentryRule],
    ['pr-d/pt', dtRule],
    ['pr-d/pd', ddRule],
    // software
    ['sw-d/filepath', inline('span', 'filepath')],
    ['sw-d/cmdname', inline('span', 'keyword cmdname')],
    ['sw-d/msgnum', inline('span', 'keyword msgnum')],
    ['sw-d/msgph', inline('samp', 'ph msgph')],
    ['sw-d/systemoutput', inline('samp', 'ph systemoutput')],
    ['sw-d/userinput', inline('kbd', 'ph userinput')],
    ['sw-d/varname', inline('var', 'keyword varname')],
    ['sw-d/msgblock', preRule],
    // user interface
    ['ui-d/uicontrol', inline('span', 'keyword uicontrol')],
    ['ui-d/wintitle', inline('span', 'keyword wintitle')],
    ['ui-d/menucascade', menucascadeRule],
    ['ui-d/shortcut', inline('kbd', 'keyword shortcut')],
    ['ui-d/screen', preRule],
    // XML mention / markup
    ['markup-d/markupname', inline('code', 'ph markupname')],
    ['xml-d/xmlelement', markupRule('<', '>', 'ph xmlelement')],
    ['xml-d/xmlatt', markupRule('@', '', 'ph xmlatt')],
    ['xml-d/textentity', markupRule('&', ';', 'ph textentity')],
    ['xml-d/parameterentity', markupRule('%', ';', 'ph parameterentity')],
    ['xml-d/numcharref', markupRule('&#', ';', 'ph numcharref')],
    ['xml-d/xmlnsname', markupRule('', '', 'ph xmlnsname')],
    ['xml-d/xmlpi', markupRule('<?', '?>', 'ph xmlpi')],
    // task
    ['task/steps', stepsRule],
    ['task/steps-unordered', stepsUnorderedRule],
    ['task/step', stepRule],
    ['task/stepsection', liRule],
    ['task/cmd', inline('span', 'ph cmd')],
    ['task/info', itemgroupRule],
    ['task/stepxmp', itemgroupRule],
    ['task/stepresult', itemgroupRule],
    ['task/tutorialinfo', itemgroupRule],
    ['task/steptroubleshooting', itemgroupRule],
    ['task/substeps', substepsRule],
    ['task/substep', stepRule],
    ['task/choices', ulRule],
    ['task/choice', liRule],
    // other domains
    ['abbrev-d/abbreviated-form', abbreviatedFormRule],
    ['equation-d/equation-number', equationNumberRule],
    ['mathml-d/mathml', foreignRule],
    ['mathml-d/mathmlref', consumedRule],
    ['svg-d/svg-container', foreignRule],
    ['svg-d/svgref', consumedRule],
    ['ut-d/area', consumedRule],
    ['ut-d/shape', consumedRule],
    ['ut-d/coords', consumedRule],
]);

/**
 * Class tokens of the standard OASIS vocabulary, used only when an element has neither an
 * instance @class nor a grammar default (the host normally supplies grammar defaults).
 * Base `topic/*` elements map to their own token; specializations list base → specific.
 */
const FALLBACK_TOKENS = new Map<string, string[]>();
for (const token of RULES.keys()) {
    if (token.startsWith('topic/')) {
        FALLBACK_TOKENS.set(tokenElement(token), [token]);
    }
}
for (const name of ['tgroup', 'colspec', 'thead', 'tbody', 'row', 'entry', 'sthead', 'strow', 'stentry', 'keywords', 'author', 'critdates', 'metadata']) {
    FALLBACK_TOKENS.set(name, [`topic/${name}`]);
}
const SPECIALIZED: [string, string, string[]][] = [
    ['topic/topic', 'concept', ['concept']], ['topic/topic', 'task', ['task']], ['topic/topic', 'reference', ['reference']],
    ['topic/topic', 'glossentry', ['glossentry']], ['topic/topic', 'glossgroup', ['glossgroup']],
    ['topic/topic', 'troubleshooting', ['troubleshooting']],
    ['topic/body', 'concept', ['conbody']], ['topic/body', 'task', ['taskbody']], ['topic/body', 'reference', ['refbody']],
    ['topic/body', 'troubleshooting', ['troublebody']], ['topic/body', 'glossentry', ['glossBody']],
    ['topic/section', 'task', ['prereq', 'context', 'result', 'postreq', 'tasktroubleshooting', 'steps-informal']],
    ['topic/section', 'reference', ['refsyn']], ['topic/section', 'troubleshooting', ['condition', 'cause', 'remedy']],
    ['topic/bodydiv', 'troubleshooting', ['troubleSolution']],
    ['topic/ol', 'task', ['steps', 'substeps']], ['topic/ul', 'task', ['steps-unordered', 'choices']],
    ['topic/li', 'task', ['step', 'substep', 'choice', 'stepsection']], ['topic/ph', 'task', ['cmd']],
    ['topic/itemgroup', 'task', ['info', 'stepxmp', 'stepresult', 'tutorialinfo', 'steptroubleshooting']],
    ['topic/simpletable', 'task', ['choicetable']], ['topic/sthead', 'task', ['chhead']], ['topic/strow', 'task', ['chrow']],
    ['topic/stentry', 'task', ['choptionhd', 'chdeschd', 'choption', 'chdesc']],
    ['topic/simpletable', 'reference', ['properties']], ['topic/sthead', 'reference', ['prophead']],
    ['topic/strow', 'reference', ['property']],
    ['topic/stentry', 'reference', ['proptypehd', 'propvaluehd', 'propdeschd', 'proptype', 'propvalue', 'propdesc']],
    ['topic/title', 'glossentry', ['glossterm']], ['topic/abstract', 'glossentry', ['glossdef']],
    ['topic/ph', 'hi-d', ['b', 'i', 'u', 'tt', 'sup', 'sub', 'line-through', 'overline']],
    ['topic/ph', 'pr-d', ['codeph', 'var', 'synph']], ['topic/keyword', 'pr-d', ['apiname', 'option', 'parmname', 'kwd']],
    ['topic/pre', 'pr-d', ['codeblock']], ['topic/xref', 'pr-d', ['coderef']], ['topic/dl', 'pr-d', ['parml']],
    ['topic/dlentry', 'pr-d', ['plentry']], ['topic/dt', 'pr-d', ['pt']], ['topic/dd', 'pr-d', ['pd']],
    ['topic/ph', 'sw-d', ['filepath', 'msgph', 'systemoutput', 'userinput']],
    ['topic/keyword', 'sw-d', ['cmdname', 'msgnum', 'varname']], ['topic/pre', 'sw-d', ['msgblock']],
    ['topic/ph', 'ui-d', ['uicontrol', 'menucascade']], ['topic/keyword', 'ui-d', ['wintitle', 'shortcut']],
    ['topic/pre', 'ui-d', ['screen']],
    ['topic/note', 'hazard-d', ['hazardstatement']], ['topic/ul', 'hazard-d', ['messagepanel']],
    ['topic/li', 'hazard-d', ['typeofhazard', 'consequence', 'howtoavoid']], ['topic/image', 'hazard-d', ['hazardsymbol']],
    ['topic/term', 'abbrev-d', ['abbreviated-form']],
    ['topic/div', 'equation-d', ['equation-block']], ['topic/ph', 'equation-d', ['equation-inline', 'equation-number']],
    ['topic/fig', 'equation-d', ['equation-figure']],
    ['topic/foreign', 'mathml-d', ['mathml']], ['topic/xref', 'mathml-d', ['mathmlref']],
    ['topic/foreign', 'svg-d', ['svg-container']], ['topic/xref', 'svg-d', ['svgref']],
    ['topic/div', 'ut-d', ['imagemap']], ['topic/figgroup', 'ut-d', ['area']], ['topic/data', 'ut-d', ['sort-as']],
];
for (const [base, module, names] of SPECIALIZED) {
    for (const name of names) {
        FALLBACK_TOKENS.set(name, [base, `${module}/${name}`]);
    }
}
for (const name of ['markupname']) {
    FALLBACK_TOKENS.set(name, ['topic/keyword', 'markup-d/markupname']);
}
for (const name of ['xmlelement', 'xmlatt', 'textentity', 'parameterentity', 'numcharref', 'xmlnsname', 'xmlpi']) {
    FALLBACK_TOKENS.set(name, ['topic/keyword', 'markup-d/markupname', `xml-d/${name}`]);
}

// ---------------------------------------------------------------------------

/** Render a whole document. */
export function renderDocument(doc: Document, options: RenderOptions = {}): RenderResult {
    const r = new Renderer(doc, options);
    let html = doc.children.map((n) => r.node(n)).join('');
    if (r.footnotes.length > 0) {
        html += `<div class="fn-container" role="doc-endnotes"><hr><div class="dc-fn-heading">${escapeHtml(r.labels.footnotes)}</div>${r.footnotes.join('')}</div>`;
    }
    return { html, undeclaredEntities: [...r.undeclared].sort(), unknownElements: [...r.unknown].sort() };
}

/**
 * Render one element of `doc` (for an incremental patch). Figure/table numbers are those of
 * the whole document. Footnotes inside the element are not collected: callers must
 * re-render the whole document when {@link needsFullRender} is true, and patch the element
 * {@link findPatchRoot} returns.
 */
export function renderElement(doc: Document, el: ElementNode, options: RenderOptions = {}): string {
    const r = new Renderer(doc, options);
    return r.element(el);
}

function tokensOf(el: ElementNode, options: RenderOptions): string[] {
    const cls = attr(el, 'class') ?? options.classOf?.(el.name);
    return cls ? classTokens(cls) : (FALLBACK_TOKENS.get(el.name) ?? []);
}

/**
 * True when an element's subtree (reused content included) holds footnotes or footnote
 * references: they are numbered and listed by a full render only.
 */
export function needsFullRender(el: ElementNode, options: RenderOptions = {}): boolean {
    const seen = new Set<object>();
    const stack: CstNode[] = [el];
    while (stack.length > 0) {
        const node = stack.pop()!;
        if (!isElement(node)) {
            continue;
        }
        const tokens = tokensOf(node, options);
        if (tokens.includes('topic/fn') || (tokens.includes('topic/xref') && attr(node, 'type') === 'fn')) {
            return true;
        }
        const res = options.resolutions?.get(node);
        for (const reused of [res?.conrefTarget, res?.conrefChildren, res?.conrefRange]) {
            if (reused && !seen.has(reused)) {
                seen.add(reused);
                stack.push(...(Array.isArray(reused) ? reused : [reused]));
            }
        }
        stack.push(...node.children);
    }
    return false;
}

const TABLE_PARTS = ['topic/tgroup', 'topic/colspec', 'topic/thead', 'topic/tbody', 'topic/row', 'topic/entry',
    'topic/sthead', 'topic/strow', 'topic/stentry'];
/** Elements always rendered by their parent's rule (they produce no output of their own). */
const RENDERED_BY_PARENT = ['topic/alt', 'topic/linktext', 'topic/longquoteref', 'topic/longdescref', 'topic/param',
    'mathml-d/mathmlref', 'svg-d/svgref'];
/** Parents that render their title/desc children themselves (caption, list heading, tooltip). */
const CAPTION_OWNERS = ['topic/fig', 'topic/table', 'topic/simpletable', 'topic/figgroup', 'topic/linklist',
    'topic/link', 'topic/xref', 'topic/object'];

/**
 * The element to re-render when `el` changed: `el` itself, unless its HTML depends on an
 * ancestor's rule — table parts (grid, header ids) widen to their table, captions and
 * other parent-rendered children to their parent, a break image to its wrapper's parent,
 * and anything inside preformatted text to the outermost whitespace-preserving ancestor.
 */
export function findPatchRoot(el: ElementNode, options: RenderOptions = {}): ElementNode {
    let root = el;
    let inTablePart = false;
    for (let node: ElementNode | null | undefined = el; node; node = node.parent) {
        const tokens = tokensOf(node, options);
        const parent = node.parent ?? undefined;
        if (TABLE_PARTS.some((t) => tokens.includes(t))) {
            inTablePart = true;
        } else if (inTablePart && (tokens.includes('topic/table') || tokens.includes('topic/simpletable'))) {
            root = node;
            inTablePart = false;
        }
        if (attr(node, 'xml:space') === 'preserve' || tokens.includes('topic/pre') || tokens.includes('topic/lines')) {
            root = node;
        }
        if (parent) {
            const captioned = (tokens.includes('topic/title') || tokens.includes('topic/desc'))
                && CAPTION_OWNERS.some((t) => tokensOf(parent, options).includes(t));
            const breakImage = tokens.includes('topic/image') && attr(node, 'placement') === 'break';
            if (captioned || breakImage || RENDERED_BY_PARENT.some((t) => tokens.includes(t))) {
                root = parent;
            }
        }
    }
    return root;
}

export type { ElementIndex };
