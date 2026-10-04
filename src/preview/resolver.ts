/**
 * Reference resolution for the visual preview (spec §7): conref/conkeyref (with
 * conrefend ranges and nested reuse), keyref text and targets, empty-xref titles, glossary
 * terms, mathmlref/svgref and coderef.
 *
 * Dependencies are injected (key lookup, file reading) so this module has no `vscode`
 * import and is unit-testable; the panel wires it to DitaCraft's KeySpaceResolver and to
 * open editors (unsaved edits) / the file system.
 */

import * as path from 'path';
import { fileURLToPath } from 'url';
import { parse, ParseError } from '../shared/cst/parse';
import { attr, childElements, findElementById, rawTextContent, rootElement, walk } from '../shared/cst/query';
import type { Document, ElementNode } from '../shared/cst/types';
import { isElement } from '../shared/cst/types';
import { classTokens } from '../shared/grammar/classTokens';
import { decodeXmlText, type EntityLookup } from '../shared/render/html';
import type { Resolution } from '../shared/render/types';

/** The subset of DitaCraft's KeyDefinition the preview uses. */
export interface KeyDefinitionLike {
    keyName: string;
    targetFile?: string;
    elementId?: string;
    inlineContent?: string;
    metadata?: { navtitle?: string; keywords?: string[]; shortdesc?: string };
}

export interface KeyLookup {
    resolveKey(keyName: string, contextFile: string): Promise<KeyDefinitionLike | null>;
}

export interface FileSource {
    /** Current text of a file (an open editor's unsaved text wins), or null if unreadable. */
    readText(filePath: string): Promise<string | null>;
}

export interface ResolverOptions {
    files: FileSource;
    keys?: KeyLookup;
    classOf?: (name: string) => string | undefined;
    entity?: EntityLookup;
    /** Nested reuse depth limit (conref inside reused content). */
    maxDepth?: number;
}

export interface ResolveOutcome {
    resolutions: Map<ElementNode, Resolution>;
    /** Absolute paths read; a change to any of them should trigger re-resolution. */
    dependencies: Set<string>;
}

type Kind = 'reuse' | 'keyref' | 'href' | 'foreign' | 'code';

interface Request {
    el: ElementNode;
    kind: Kind;
}

/** State of one resolution pass. */
interface Pass {
    out: Map<ElementNode, Resolution>;
    deps: Set<string>;
    glossarySeen: Set<string>;
    /** Reused elements whose own references were already resolved in this pass. */
    expanded: Set<ElementNode>;
}

const NAME_KIND_TOKENS: Record<string, string[]> = {
    xref: ['topic/xref'], link: ['topic/link'], image: ['topic/image'], term: ['topic/term'],
    'abbreviated-form': ['topic/term', 'abbrev-d/abbreviated-form'], mathmlref: ['topic/xref', 'mathml-d/mathmlref'],
    svgref: ['topic/xref', 'svg-d/svgref'], coderef: ['topic/xref', 'pr-d/coderef'], glossentry: ['topic/topic', 'glossentry/glossentry'],
    glossterm: ['topic/title', 'glossentry/glossterm'], title: ['topic/title'],
};

const PUSH_ACTIONS = new Set(['pushafter', 'pushbefore', 'pushreplace', 'mark']);

export class ReferenceResolver {
    private readonly parsed = new Map<string, { text: string; doc: Document | null }>();

    constructor(private readonly opts: ResolverOptions) {}

    /** Class tokens of an element (instance @class, grammar default, or standard name). */
    tokens(el: ElementNode): string[] {
        const cls = attr(el, 'class') ?? this.opts.classOf?.(el.name);
        return cls ? classTokens(cls) : (NAME_KIND_TOKENS[el.name] ?? []);
    }

    /** References in a subtree, document order. */
    collect(nodes: Document | ElementNode): Request[] {
        const out: Request[] = [];
        const roots = 'source' in nodes ? nodes.children : [nodes];
        for (const node of walk(roots)) {
            if (!isElement(node)) {
                continue;
            }
            const tokens = this.tokens(node);
            const conaction = attr(node, 'conaction');
            const conref = attr(node, 'conref');
            if ((attr(node, 'conkeyref') || (conref && conref !== '-dita-use-conref-target')) && !(conaction && PUSH_ACTIONS.has(conaction))) {
                out.push({ el: node, kind: 'reuse' });
                continue; // reused content replaces this element's own subtree
            }
            if (tokens.includes('mathml-d/mathmlref') || tokens.includes('svg-d/svgref')) {
                out.push({ el: node, kind: 'foreign' });
            } else if (tokens.includes('pr-d/coderef')) {
                out.push({ el: node, kind: 'code' });
            } else if (attr(node, 'keyref')) {
                out.push({ el: node, kind: 'keyref' });
            } else if ((tokens.includes('topic/xref') || tokens.includes('topic/link')) && attr(node, 'href') && isEmpty(node, this.tokens.bind(this))) {
                out.push({ el: node, kind: 'href' });
            }
        }
        return out;
    }

    /** Resolve every reference of `doc` (located at `docPath`). */
    async resolve(doc: Document, docPath: string): Promise<ResolveOutcome> {
        const pass: Pass = {
            out: new Map<ElementNode, Resolution>(),
            deps: new Set<string>(),
            glossarySeen: new Set<string>(),
            expanded: new Set<ElementNode>(),
        };
        await this.resolveIn(doc, doc, docPath, pass, 0, new Set());
        return { resolutions: pass.out, dependencies: pass.deps };
    }

    /**
     * Resolve one reuse element (`el` in `doc`) on its own: the visual editor's Open source and
     * Replace with copy. Chained reuse is followed to the content it finally reuses.
     */
    async resolveReuseOf(el: ElementNode, doc: Document, docPath: string): Promise<Resolution> {
        const conaction = attr(el, 'conaction');
        const conref = attr(el, 'conref');
        if (!(attr(el, 'conkeyref') || (conref && conref !== '-dita-use-conref-target')) || (conaction && PUSH_ACTIONS.has(conaction))) {
            return { kind: 'conref', unresolved: 'not reused content' };
        }
        const pass: Pass = { out: new Map(), deps: new Set(), glossarySeen: new Set(), expanded: new Set() };
        return (await this.resolveReuse(el, doc, docPath, pass, 0, new Set())) ?? { kind: 'conref', unresolved: 'no reuse target' };
    }

    /**
     * What a map's reference (`topicref` and its specializations, `navref`) points to, for the
     * visual editor's rows (spec §13.8): the title of its topic or map — through the key space for
     * `keyref`, which wins over `href` when the key is defined — or why it cannot be read. A key
     * that names no file gives its navigation title or text. Undefined when there is nothing to
     * read: no target, a web address, another format than DITA. Files read go to `deps`.
     */
    async resolveMapReference(el: ElementNode, docPath: string, deps: Set<string>): Promise<Resolution | undefined> {
        const tokens = this.tokens(el);
        const mapref = tokens.includes('map/navref') ? attr(el, 'mapref') : undefined;
        const keyref = mapref ? undefined : attr(el, 'keyref');
        const href = mapref ?? attr(el, 'href');
        const format = mapref ? 'ditamap' : attr(el, 'format');
        if (keyref) {
            const [key, subId] = splitOnce(decode(keyref), '/');
            const def = this.opts.keys ? await this.opts.keys.resolveKey(key, docPath) : null;
            if (def?.targetFile) {
                const navtitle = def.metadata?.navtitle?.trim();
                if (navtitle) {
                    return { kind: 'key', key, text: navtitle, path: def.targetFile };
                }
                return { ...(await this.titleOfFile(def.targetFile, def.elementId, subId || undefined, isMapFile(def.targetFile), deps)), kind: 'key', key };
            }
            const text = def ? (def.metadata?.navtitle || def.inlineContent?.trim() || def.metadata?.keywords?.[0]) : undefined;
            if (text) {
                return { kind: 'key', key, text };
            }
            if (!href) {
                return { kind: 'key', key, unresolved: this.opts.keys ? `key "${key}" is not defined` : 'no key space' };
            }
            // An undefined key falls back to the reference's href.
        }
        if (!href) {
            return undefined;
        }
        const target = decode(href);
        if (attr(el, 'scope') === 'external' || (/^[a-z][w+.-]+:/i.test(target) && !/^file:/i.test(target))
            || (format && format !== 'dita' && format !== 'ditamap')) {
            return undefined;
        }
        const ref = parseReference(target);
        if (!ref.file) {
            return undefined; // a reference inside the map itself
        }
        const filePath = resolvePath(docPath, ref.file);
        return this.titleOfFile(filePath, ref.topicId, ref.elemId, format === 'ditamap' || isMapFile(filePath), deps);
    }

    /** The title of a map, or of a topic (by id, else the first) or an element in it. */
    private async titleOfFile(filePath: string, topicId: string | undefined, elemId: string | undefined, map: boolean, deps: Set<string>): Promise<Resolution> {
        const res: Resolution = { kind: 'href', path: filePath, fragment: [topicId, elemId].filter(Boolean).join('/') || undefined };
        const target = await this.load(filePath, deps);
        if (!target) {
            return { ...res, unresolved: `cannot read ${path.basename(filePath)}` };
        }
        const root = rootElement(target);
        if (map && root) {
            return { ...res, text: this.mapTitle(root) ?? path.basename(filePath) };
        }
        let found = findTarget(target, topicId, elemId);
        if (found && !topicId && !elemId && !this.titleChild(found)) {
            // A <dita> container: its first topic.
            found = childElements(found).find((c) => this.titleChild(c) !== undefined) ?? found;
        }
        if (!found) {
            return { ...res, unresolved: `${res.fragment ?? path.basename(filePath)} not found` };
        }
        return { ...res, text: this.titleText(found) };
    }

    /** A map's title: its `<title>` (a bookmap's main title), else its `@title`. */
    private mapTitle(root: ElementNode): string | undefined {
        const title = this.titleChild(root);
        if (title) {
            const main = childElements(title).find((c) => c.name === 'mainbooktitle' || this.tokens(c).includes('bookmap/mainbooktitle'));
            const text = this.plainText(main ?? title);
            if (text) {
                return text;
            }
        }
        const attribute = attr(root, 'title');
        return attribute ? decodeXmlText(attribute, this.opts.entity).replace(/s+/g, ' ').trim() || undefined : undefined;
    }

    private titleChild(el: ElementNode): ElementNode | undefined {
        return childElements(el).find((c) => c.name === 'title' || c.name === 'booktitle' || this.tokens(c).includes('topic/title'));
    }

    /** Forget cached file parses (all, or one file). */
    invalidate(filePath?: string): void {
        if (filePath) {
            this.parsed.delete(path.resolve(filePath));
        } else {
            this.parsed.clear();
        }
    }

    private async resolveIn(scope: Document | ElementNode, doc: Document, docPath: string, pass: Pass, depth: number, chain: Set<string>): Promise<void> {
        const requests = this.collect(scope);
        // Glossary first-use needs document order; everything else may run concurrently.
        const glossary = requests.filter((r) => r.kind === 'keyref' && this.tokens(r.el).includes('topic/term'));
        const others = requests.filter((r) => !glossary.includes(r));
        const run = async (request: Request): Promise<void> => {
            let res: Resolution | undefined;
            try {
                res = await this.resolveOne(request, doc, docPath, pass, depth, chain);
            } catch (error) {
                res = { kind: 'key', unresolved: error instanceof Error ? error.message : String(error) };
            }
            // Content reused along several paths is resolved once per path; a failure found
            // on one path (a cycle) is kept, so rendering never follows it.
            if (res && !pass.out.get(request.el)?.unresolved) {
                pass.out.set(request.el, res);
            }
        };
        await Promise.all(others.map(run));
        for (const request of glossary) {
            await run(request);
        }
    }

    private async resolveOne(request: Request, doc: Document, docPath: string, pass: Pass, depth: number, chain: Set<string>): Promise<Resolution | undefined> {
        switch (request.kind) {
            case 'reuse': return this.resolveReuse(request.el, doc, docPath, pass, depth, chain);
            case 'keyref': return this.resolveKeyref(request.el, docPath, pass.deps, pass.glossarySeen);
            case 'href': return this.resolveHref(request.el, doc, docPath, pass.deps);
            case 'foreign': return this.resolveForeign(request.el, docPath, pass.deps);
            case 'code': return this.resolveCode(request.el, docPath, pass.deps);
        }
    }

    // -- reuse ------------------------------------------------------------------------

    private async resolveReuse(el: ElementNode, doc: Document, docPath: string, pass: Pass, depth: number, chain: Set<string>): Promise<Resolution | undefined> {
        const { deps, out } = pass;
        const maxDepth = this.opts.maxDepth ?? 8;
        let target: { doc: Document; path: string; topicId?: string; elemId?: string; display: string } | undefined;
        let failure: string | undefined;

        const conkeyref = attr(el, 'conkeyref');
        if (conkeyref && this.opts.keys) {
            const [key, elemId] = splitOnce(decode(conkeyref), '/');
            const def = await this.opts.keys.resolveKey(key, docPath);
            if (def?.targetFile) {
                const loaded = await this.load(def.targetFile, deps);
                if (loaded) {
                    target = { doc: loaded, path: def.targetFile, topicId: def.elementId, elemId: elemId || undefined, display: `${key}/${elemId ?? ''}` };
                } else {
                    failure = `cannot read ${path.basename(def.targetFile)}`;
                }
            } else {
                failure = `key "${key}" is not defined`;
            }
        }
        const conref = attr(el, 'conref');
        if (!target && conref && conref !== '-dita-use-conref-target') {
            const ref = parseReference(decode(conref));
            const filePath = ref.file ? resolvePath(docPath, ref.file) : docPath;
            const loaded = ref.file ? await this.load(filePath, deps) : doc;
            if (loaded) {
                target = { doc: loaded, path: filePath, topicId: ref.topicId, elemId: ref.elemId, display: `${ref.file ? path.basename(filePath) : ''}#${ref.fragment}` };
                failure = undefined;
            } else {
                failure = `cannot read ${path.basename(filePath)}`;
            }
        }
        if (!target) {
            return { kind: 'conref', unresolved: failure ?? 'no reuse target' };
        }

        const found = findTarget(target.doc, target.topicId, target.elemId);
        if (!found) {
            return { kind: 'conref', unresolved: `${target.display} not found`, path: target.path };
        }
        const chainKey = `${path.resolve(target.path)}#${target.topicId ?? ''}/${target.elemId ?? ''}`;
        // Reusing itself or an ancestor would contain itself: circular whatever the path.
        const containsSelf = target.doc === doc && (found === el || isAncestor(found, el));
        if (containsSelf || chain.has(chainKey) || depth >= maxDepth) {
            return { kind: 'conref', unresolved: containsSelf || chain.has(chainKey) ? 'circular reuse' : 'reuse nested too deeply', path: target.path };
        }

        let range: ElementNode[] | undefined;
        const conrefend = attr(el, 'conrefend');
        if (conrefend) {
            const endRef = parseReference(decode(conrefend));
            const end = findTarget(target.doc, endRef.topicId ?? target.topicId, endRef.elemId);
            range = end ? siblingRange(found, end) : undefined;
        }

        // Nested references inside the reused content resolve relative to its own file —
        // once per pass, however many times the content is reused.
        const nextChain = new Set(chain).add(chainKey);
        for (const part of range ?? [found]) {
            if (!pass.expanded.has(part)) {
                pass.expanded.add(part);
                await this.resolveIn(part, target.doc, target.path, pass, depth + 1, nextChain);
            }
        }

        const res: Resolution = {
            kind: 'conref',
            from: target.display,
            path: target.path,
            fragment: [target.topicId, target.elemId].filter(Boolean).join('/'),
            sourceDoc: target.doc,
            sourcePath: target.path,
        };
        if (range) {
            res.conrefRange = range;
        } else {
            // A target that is itself a reference (chained reuse) contributes its resolved
            // target — or its failure, so a broken chain shows on the element the author wrote.
            const chained = out.get(found);
            if (chained?.kind === 'conref' && chained.unresolved) {
                return { kind: 'conref', unresolved: chained.unresolved, path: target.path, from: target.display };
            }
            if (chained?.conrefTarget) {
                res.conrefTarget = chained.conrefTarget;
                res.sourceDoc = chained.sourceDoc;
                res.sourcePath = chained.sourcePath;
            } else if (chained?.conrefRange) {
                res.conrefRange = chained.conrefRange;
                res.sourceDoc = chained.sourceDoc;
                res.sourcePath = chained.sourcePath;
            } else {
                res.conrefTarget = found;
            }
        }
        return res;
    }

    // -- keys ---------------------------------------------------------------------------

    private async resolveKeyref(el: ElementNode, docPath: string, deps: Set<string>, glossarySeen: Set<string>): Promise<Resolution> {
        const raw = decode(attr(el, 'keyref') ?? '');
        const [key, subId] = splitOnce(raw, '/');
        if (!this.opts.keys) {
            return { kind: 'key', key, unresolved: 'no key space' };
        }
        const def = await this.opts.keys.resolveKey(key, docPath);
        if (!def) {
            return { kind: 'key', key, unresolved: `key "${key}" is not defined` };
        }
        const tokens = this.tokens(el);
        const res: Resolution = { kind: 'key', key };
        if (def.targetFile) {
            res.path = def.targetFile;
            res.fragment = [def.elementId, subId].filter(Boolean).join('/') || undefined;
        }
        if (tokens.includes('topic/image')) {
            return res; // the renderer loads res.path
        }
        if (tokens.includes('topic/term') && def.targetFile) {
            const gloss = await this.glossaryText(def, tokens.includes('abbrev-d/abbreviated-form'), glossarySeen, deps);
            if (gloss !== undefined) {
                return { ...res, kind: 'glossary', text: gloss };
            }
        }
        const keyText = def.inlineContent?.trim() || def.metadata?.keywords?.[0] || def.metadata?.navtitle;
        if (keyText) {
            res.text = keyText;
        } else if (def.targetFile) {
            const target = await this.load(def.targetFile, deps);
            const titled = target ? findTarget(target, def.elementId, subId || undefined) : undefined;
            res.text = titled ? this.titleText(titled) : path.basename(def.targetFile);
        }
        return res;
    }

    private async glossaryText(def: KeyDefinitionLike, abbreviated: boolean, seen: Set<string>, deps: Set<string>): Promise<string | undefined> {
        const doc = await this.load(def.targetFile!, deps);
        const entry = doc ? findTarget(doc, def.elementId, undefined) : undefined;
        if (!entry || !(entry.name === 'glossentry' || this.tokens(entry).includes('glossentry/glossentry'))) {
            return undefined;
        }
        const first = (name: string) => {
            for (const node of walk(entry.children)) {
                if (isElement(node) && (node.name === name || this.tokens(node).some((t) => t.endsWith(`/${name}`)))) {
                    return this.plainText(node);
                }
            }
            return undefined;
        };
        const term = first('glossterm');
        if (!abbreviated) {
            return term;
        }
        const short = first('glossAcronym') ?? first('glossAbbreviation') ?? first('glossShortForm');
        if (!seen.has(def.keyName)) {
            seen.add(def.keyName);
            return first('glossSurfaceForm') ?? (term && short ? `${term} (${short})` : term);
        }
        return short ?? term;
    }

    // -- links, foreign, code ---------------------------------------------------------------

    private async resolveHref(el: ElementNode, doc: Document, docPath: string, deps: Set<string>): Promise<Resolution | undefined> {
        const href = decode(attr(el, 'href') ?? '');
        const format = attr(el, 'format');
        // A URI scheme has 2+ characters: C:\… is a Windows path, not a URL.
        if (attr(el, 'scope') === 'external' || (/^[a-z][\w+.-]+:/i.test(href) && !/^file:/i.test(href))
            || (format && format !== 'dita' && format !== 'ditamap')) {
            return undefined;
        }
        const ref = parseReference(href);
        const filePath = ref.file ? resolvePath(docPath, ref.file) : docPath;
        const target = ref.file ? await this.load(filePath, deps) : doc;
        const res: Resolution = { kind: 'href', path: filePath, fragment: ref.fragment || undefined };
        if (!target) {
            return { ...res, unresolved: `cannot read ${path.basename(filePath)}` };
        }
        const found = findTarget(target, ref.topicId, ref.elemId);
        if (!found) {
            return { ...res, unresolved: `${ref.fragment || path.basename(filePath)} not found` };
        }
        res.text = this.titleText(found);
        return res;
    }

    private async resolveForeign(el: ElementNode, docPath: string, deps: Set<string>): Promise<Resolution> {
        const filePath = await this.targetPath(el, docPath);
        if (!filePath) {
            return { kind: 'foreign', unresolved: 'no target' };
        }
        const doc = await this.load(filePath.path, deps);
        const root = doc ? (filePath.fragment ? findElementById(doc.children, filePath.fragment) : rootElement(doc)) : undefined;
        if (!doc || !root) {
            return { kind: 'foreign', unresolved: `cannot read ${path.basename(filePath.path)}` };
        }
        return { kind: 'foreign', foreignRoot: root, sourceDoc: doc, sourcePath: filePath.path, path: filePath.path };
    }

    private async resolveCode(el: ElementNode, docPath: string, deps: Set<string>): Promise<Resolution> {
        const target = await this.targetPath(el, docPath);
        if (!target) {
            return { kind: 'code', unresolved: 'no target' };
        }
        deps.add(path.resolve(target.path));
        const text = await this.opts.files.readText(target.path);
        if (text === null) {
            return { kind: 'code', unresolved: `cannot read ${path.basename(target.path)}`, path: target.path };
        }
        return { kind: 'code', text: selectLines(text, target.fragment), path: target.path };
    }

    private async targetPath(el: ElementNode, docPath: string): Promise<{ path: string; fragment?: string } | undefined> {
        const keyref = attr(el, 'keyref');
        if (keyref && this.opts.keys) {
            const def = await this.opts.keys.resolveKey(splitOnce(decode(keyref), '/')[0], docPath);
            if (def?.targetFile) {
                return { path: def.targetFile, fragment: def.elementId };
            }
        }
        const href = attr(el, 'href');
        if (!href) {
            return undefined;
        }
        const [file, fragment] = splitOnce(decode(href), '#');
        return { path: resolvePath(docPath, file), fragment: fragment || undefined };
    }

    // -- helpers ----------------------------------------------------------------------------

    private async load(filePath: string, deps: Set<string>): Promise<Document | null> {
        const abs = path.resolve(filePath);
        deps.add(abs);
        const text = await this.opts.files.readText(abs);
        if (text === null) {
            return null;
        }
        const cached = this.parsed.get(abs);
        if (cached && cached.text === text) {
            return cached.doc;
        }
        let doc: Document | null = null;
        try {
            doc = parse(text);
        } catch (error) {
            if (!(error instanceof ParseError)) {
                throw error;
            }
        }
        this.parsed.set(abs, { text, doc });
        return doc;
    }

    private plainText(el: ElementNode): string {
        return decodeXmlText(rawTextContent(el), this.opts.entity).replace(/\s+/g, ' ').trim();
    }

    /** Title of a topic/element (its title child), else its first words. */
    private titleText(el: ElementNode): string {
        const title = this.titleChild(el);
        if (title) {
            return this.plainText(title);
        }
        const text = this.plainText(el);
        return text.length > 80 ? `${text.slice(0, 77)}…` : text;
    }
}

function isMapFile(filePath: string): boolean {
    return /.(ditamap|bookmap)$/i.test(filePath);
}

function isAncestor(candidate: ElementNode, el: ElementNode): boolean {
    for (let p = el.parent; p; p = p.parent) {
        if (p === candidate) {
            return true;
        }
    }
    return false;
}

function isEmpty(el: ElementNode, tokensOf: (e: ElementNode) => string[]): boolean {
    return el.children.every((c) => {
        if (c.type === 'text') {
            return c.raw.trim() === '';
        }
        // A <desc> child is a tooltip, not link text.
        return isElement(c) && (c.name === 'desc' || tokensOf(c).includes('topic/desc'));
    });
}

function decode(value: string): string {
    return decodeXmlText(value);
}

function splitOnce(value: string, sep: string): [string, string] {
    const i = value.indexOf(sep);
    return i === -1 ? [value, ''] : [value.slice(0, i), value.slice(i + 1)];
}

interface ParsedReference {
    file: string;
    fragment: string;
    topicId?: string;
    elemId?: string;
}

/** "file.dita#topic/elem", "#topic/elem", "#topic", "file.dita". */
export function parseReference(value: string): ParsedReference {
    const [file, fragment] = splitOnce(value.trim(), '#');
    const [topicId, elemId] = splitOnce(fragment, '/');
    return { file, fragment, topicId: topicId || undefined, elemId: elemId || undefined };
}

/** Resolve a DITA URI reference relative to the referencing file. */
export function resolvePath(fromFile: string, reference: string): string {
    if (/^file:/i.test(reference)) {
        try {
            // Handles file:///C:/…, file:///home/… and UNC file://server/share/… alike.
            return path.resolve(fileURLToPath(reference));
        } catch {
            // Not a valid file URL here (e.g. a host on POSIX): fall through.
        }
    }
    let ref = reference;
    try {
        ref = decodeURI(reference);
    } catch {
        // Malformed escapes: use the reference as written.
    }
    if (/^file:\/\//i.test(ref)) {
        ref = ref.replace(/^file:\/\/\/?/i, process.platform === 'win32' ? '' : '/');
    }
    return path.resolve(path.dirname(fromFile), ref);
}

/** The topic (by id, else the root) and, inside it, the element (by id). */
function findTarget(doc: Document, topicId: string | undefined, elemId: string | undefined): ElementNode | undefined {
    let scope: ElementNode | undefined = rootElement(doc);
    if (topicId) {
        scope = findElementById(doc.children, topicId);
        if (!scope && !elemId) {
            return undefined;
        }
    }
    if (!elemId) {
        return scope;
    }
    return scope ? findElementById(scope.children, elemId) ?? (attr(scope, 'id') === elemId ? scope : undefined) : undefined;
}

/** `start` and its following element siblings up to and including `end` (same parent). */
function siblingRange(start: ElementNode, end: ElementNode): ElementNode[] | undefined {
    if (start === end) {
        return [start];
    }
    if (!start.parent || start.parent !== end.parent) {
        return undefined;
    }
    const siblings = childElements(start.parent);
    const a = siblings.indexOf(start);
    const b = siblings.indexOf(end);
    return a !== -1 && b >= a ? siblings.slice(a, b + 1) : undefined;
}

/** DITA 1.3 coderef fragments: `#line-range(3,5)` / `#line-range(3)`. */
export function selectLines(text: string, fragment: string | undefined): string {
    const m = fragment ? /^line-range\(\s*(\d+)\s*(?:,\s*(\d+)\s*)?\)$/.exec(fragment) : null;
    if (!m) {
        return text;
    }
    const lines = text.split(/\r?\n/);
    const start = Math.max(1, Number(m[1]));
    const end = m[2] ? Number(m[2]) : lines.length;
    return lines.slice(start - 1, end).join('\n');
}
