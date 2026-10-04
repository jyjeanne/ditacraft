/**
 * Visual editor page script (spec §13). Runs inside the custom editor's webview; bundled by
 * esbuild with ProseMirror to out/webview/editor.js.
 *
 * The page builds the ProseMirror document from the source text the host sends (through
 * the CST, src/shared/editor/), and after every change serializes it back losslessly and
 * sends the host one minimal span edit (EditSync). The host applies it to the VS Code
 * document; changes made elsewhere come back as `update` and the page rebuilds.
 *
 * Undo/redo are ProseMirror's (they also reach the document as edits). Keys the editor
 * handles are not passed on to VS Code's keybindings (Ctrl+B is bold here, not "toggle
 * side bar").
 */

import { baseKeymap, chainCommands, createParagraphNear, newlineInCode, toggleMark } from 'prosemirror-commands';
import { dropCursor } from 'prosemirror-dropcursor';
import { gapCursor } from 'prosemirror-gapcursor';
import { history, redo, redoDepth, undo, undoDepth } from 'prosemirror-history';
import { keymap } from 'prosemirror-keymap';
import { DOMParser as PMDOMParser, DOMSerializer, Fragment, type DOMOutputSpec, type MarkType, type Node as PMNode, type Schema, type TagParseRule } from 'prosemirror-model';
import { type Command, EditorState, NodeSelection, Plugin, PluginKey, Selection, TextSelection, type Transaction } from 'prosemirror-state';
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view';
import type { EditorSettings, EditorToHost, HostToEditor, ReuseAction, SelectedElement, SyncMode } from '../../src/editor/messages';
import { parse, ParseError } from '../../src/shared/cst/parse';
import { doctypeInternalSubset } from '../../src/shared/cst/query';
import type { Document as CstDocument } from '../../src/shared/cst/types';
import { DitaCommands } from '../../src/shared/editor/commands';
import { contextMenu, findItem, imageItems, insertItems, relTableItems, tableItems, type MenuContext, type MenuItem } from '../../src/shared/editor/contextMenu';
import { droppedUris, ImageCommands, isImagePath, type ImagePlacement } from '../../src/shared/editor/images';
import { LinkCommands } from '../../src/shared/editor/links';
import { MapCommands } from '../../src/shared/editor/mapCommands';
import { RelTableCommands } from '../../src/shared/editor/relTables';
import { hiddenMetadataSelection, isMapDocument, isMapRow, mapRowTarget, selectedRow, type MapRowTarget } from '../../src/shared/editor/maps';
import { problemMarks, type ProblemItem, type ProblemMark } from '../../src/shared/editor/problems';
import { buildEditorSchema, type EditorSchema } from '../../src/shared/editor/schema';
import { sourceChangeTransaction } from '../../src/shared/editor/sourceChange';
import { SourcePositions } from '../../src/shared/editor/sourcePositions';
import { TableCommands } from '../../src/shared/editor/tables';
import { EditSync } from '../../src/shared/editor/sync';
import { buildDocument, buildFragment, type Base } from '../../src/shared/editor/toProseMirror';
import { serializeDocument } from '../../src/shared/editor/toSource';
import type { Grammar } from '../../src/shared/grammar/types';
import { internalSubsetEntities } from '../../src/shared/render/html';
import { format, labelsFor, type Labels } from '../../src/shared/render/labels';
import { isReuseNode, resolvedTargets, type ResolvedItem } from '../../src/shared/editor/reused';
import { columnResizing } from './columnResize';
import { resolvedNodeViews } from './reusedView';
import { imageResizing } from './imageResize';
import { cellAt, dropRow, editRowLabel, foldPaths, mapNodeViews, mapPlugin, moveRow, restoreFolds, rowByLabel, setAllFolds, setFold, type MapPage } from './mapView';
import { closeMenu, openMenu, showMenu, type MenuOptions } from './menu';

interface VsCodeApi {
    postMessage(message: unknown): void;
}
declare function acquireVsCodeApi(): VsCodeApi;

const vscode = acquireVsCodeApi();
const toolbar = document.getElementById('dc-toolbar') as HTMLElement;
const banner = document.getElementById('dc-banner') as HTMLElement;
const content = document.getElementById('dc-content') as HTMLElement;
const status = document.getElementById('dc-status') as HTMLElement;

function post(message: EditorToHost): void {
    vscode.postMessage(message);
}

interface Session {
    es: EditorSchema;
    cmds: DitaCommands;
    tables: TableCommands;
    images: ImageCommands;
    links: LinkCommands;
    base: Base;
    sync: EditSync;
    labels: Labels;
    grammarLabel: string;
    fileName: string;
    readOnly: boolean;
    /** The document is a map (spec §13.8): its references are rows. */
    map: boolean;
    maps: MapCommands;
    rel: RelTableCommands;
    page: MapPage;
}

let session: Session | undefined;
let view: EditorView | undefined;
/** Set while the document text is not well-formed: editing is paused on the last good page. */
let paused: string | undefined;
let showMarkup = false;
const schemas = new Map<Grammar, EditorSchema>();

// ---------------------------------------------------------------------------------------------
// Document building

function build(cst: CstDocument, es: EditorSchema): { doc: PMNode; base: Base } {
    const subset = internalSubsetEntities(doctypeInternalSubset(cst));
    return buildDocument(cst, es, { entity: (name) => subset.get(name) ?? es.grammar.entities[name] });
}

function plugins(es: EditorSchema, cmds: DitaCommands, tables: TableCommands, page: MapPage): Plugin[] {
    const keys: Record<string, Command> = {
        'Mod-z': undo,
        'Mod-y': redo,
        'Shift-Mod-z': redo,
        Enter: chainCommands(newlineInCode, cmds.enter, createParagraphNear),
        // In a table Tab moves between cells; in a list it nests the item.
        Tab: chainCommands(tables.goToCell(1), cmds.indentItem),
        'Shift-Tab': chainCommands(tables.goToCell(-1), cmds.outdentItem),
        // A link: insert, or change its target (the picker opens).
        'Mod-k': (state) => {
            if (!session?.links.setLink()(state)) {
                return false;
            }
            void pickAndSetLink();
            return true;
        },
        // Quick fixes for the problem at the cursor.
        'Mod-.': (state, _dispatch, v) => {
            if (!v || !problemHere(state)) {
                return false;
            }
            const coords = v.coordsAtPos(state.selection.head);
            void showQuickFixes({ x: coords.left, y: coords.bottom + 2 }, true);
            return true;
        },
        // The right-click menu from the keyboard.
        ContextMenu: (state, dispatch, v) => contextMenuAtCursor(state, dispatch, v),
        'Shift-F10': (state, dispatch, v) => contextMenuAtCursor(state, dispatch, v),
    };
    const markKeys: [string, string][] = [['Mod-b', 'b'], ['Mod-i', 'i'], ['Mod-u', 'u'], ['Mod-e', 'codeph'], ['Mod-`', 'codeph']];
    for (const [key, element] of markKeys) {
        const type = es.markType(element);
        if (type) {
            keys[key] = toggleMark(type);
        }
    }
    const base: Record<string, Command> = { ...baseKeymap };
    delete base.Enter; // DITA-aware Enter above
    return [
        ...mapPlugin(page), // keys on a selected map row first
        keymap(keys),
        keymap(base),
        history(),
        gapCursor(),
        dropCursor(),
        // Keep the document in the shapes the editor expects (merged text runs, text-only
        // elements as textblocks) after every change.
        new Plugin({ appendTransaction: (trs, _old, state) => (trs.some((t) => t.docChanged) ? cmds.normalize(state) : null) }),
        problemsPlugin(),
        resolvedPlugin(),
        columnResizing(() => ({ es, tables, editable })),
        imageResizing(() => (session ? { images: session.images, editable } : undefined)),
    ];
}

// ---------------------------------------------------------------------------------------------
// Problem marks (spec §11.1): the language server's diagnostics as decorations. They move with
// the text while editing and are recomputed when new diagnostics arrive.

const problemsKey = new PluginKey<DecorationSet>('dcProblems');

function problemsPlugin(): Plugin<DecorationSet> {
    return new Plugin<DecorationSet>({
        key: problemsKey,
        state: {
            init: () => DecorationSet.empty,
            apply: (tr, set) => (tr.getMeta(problemsKey) as DecorationSet | undefined) ?? set.map(tr.mapping, tr.doc),
        },
        props: { decorations: (state) => problemsKey.getState(state) },
    });
}

/**
 * A build of the text the host has (the page's document serializes to it when no edit is in
 * flight): every node with its source range, for mapping source offsets (problems, sync, reuse).
 */
let freshCache: { es: EditorSchema; text: string; built: { doc: PMNode; base: Base } } | undefined;

function freshBuild(): { doc: PMNode; base: Base } | undefined {
    if (!session) {
        return undefined;
    }
    const text = session.sync.latest;
    if (!freshCache || freshCache.text !== text || freshCache.es !== session.es) {
        try {
            freshCache = { es: session.es, text, built: build(parse(text), session.es) };
        } catch {
            freshCache = undefined;
            return undefined;
        }
    }
    return freshCache.built;
}

// ---------------------------------------------------------------------------------------------
// Resolved references shown on the page: reused content in the reuse boxes (spec §13.7), keys'
// texts, link targets' titles, key images. The host resolves them (src/editor/reusedContent.ts);
// node decorations attach them to the elements kept whole (./reusedView.ts draws them), and
// move with them while editing.

const resolvedKey = new PluginKey<DecorationSet>('dcResolved');

function resolvedPlugin(): Plugin<DecorationSet> {
    return new Plugin<DecorationSet>({
        key: resolvedKey,
        state: {
            init: () => DecorationSet.empty,
            apply: (tr, set, oldState) => (tr.getMeta(resolvedKey) as DecorationSet | undefined) ?? followMoves(set, tr, oldState.doc),
        },
        props: { decorations: (state) => resolvedKey.getState(state) },
    });
}

/**
 * The resolved references mapped through a change. A moved element (Move up/down, a map row
 * indented or dragged) is deleted and inserted again — the same node: what it showed goes with
 * it, instead of waiting for the host to resolve the document again.
 */
function followMoves(set: DecorationSet, tr: Transaction, oldDoc: PMNode): DecorationSet {
    const mapped = set.map(tr.mapping, tr.doc);
    if (!tr.docChanged) {
        return mapped;
    }
    const kept = new Set(mapped.find().map((d) => d.spec));
    const lost = new Map<PMNode, object>();
    for (const d of set.find()) {
        const node = kept.has(d.spec) ? null : oldDoc.nodeAt(d.from);
        if (node) {
            lost.set(node, d.spec);
        }
    }
    if (lost.size === 0) {
        return mapped;
    }
    const found: Decoration[] = [];
    tr.doc.descendants((node, pos) => {
        const spec = lost.get(node);
        if (spec) {
            found.push(Decoration.node(pos, pos + node.nodeSize, {}, spec));
            lost.delete(node);
        }
        return lost.size > 0;
    });
    return found.length > 0 ? mapped.add(tr.doc, found) : mapped;
}

/** The resolved references last received, and whether they wait for the in-flight edit. */
let resolved: { version: number; items: ResolvedItem[] } | undefined;
let resolvedWaiting = false;

/** Attach the resolved references to their elements; their offsets are those of the text at their version. */
function showResolved(): void {
    if (!resolved || !session || !view || paused !== undefined) {
        return;
    }
    flush();
    if (session.sync.busy) {
        resolvedWaiting = true;
        return;
    }
    resolvedWaiting = false;
    if (resolved.version !== session.sync.documentVersion) {
        return; // for an older text: the boxes keep what they show until the host sends more
    }
    const fresh = freshBuild();
    if (!fresh) {
        return;
    }
    const targets = resolvedTargets(view.state.doc, fresh, resolved.items, session.es);
    const decorations = targets.map(({ pos, item }) => Decoration.node(pos, pos + view!.state.doc.nodeAt(pos)!.nodeSize, {}, { resolved: item }));
    view.dispatch(view.state.tr.setMeta(resolvedKey, DecorationSet.create(view.state.doc, decorations)));
    const text = (item: ResolvedItem): string => {
        if (item.html !== undefined) {
            const scratch = document.createElement('div');
            scratch.innerHTML = item.html;
            return (scratch.textContent ?? '').replace(/\s+/g, ' ').trim();
        }
        return item.text ?? (item.src ? `image:${item.src.split('/').pop()}` : `⚠ ${item.error ?? ''}`);
    };
    post({ type: 'resolvedShown', texts: targets.map(({ item }) => text(item)) });
}

/** The diagnostics last received, and whether they wait for the in-flight edit. */
let problems: { version: number; items: ProblemItem[] } | undefined;
let problemsWaiting = false;

function problemText(item: ProblemItem): string {
    return `${item.severity.toUpperCase()} (${format(t('line'), item.line)}): ${item.message}${item.code ? ` [${item.code}]` : ''}`;
}

/**
 * Map the diagnostics onto the page. Their offsets are those of the document's text: wait
 * until the host has the text the page shows (no edit in flight).
 */
function showProblems(): void {
    if (!problems || !session || !view || paused !== undefined) {
        return;
    }
    flush();
    if (session.sync.busy) {
        problemsWaiting = true;
        return;
    }
    problemsWaiting = false;
    let marks: ProblemMark[] = [];
    const fresh = problems.items.length > 0 ? freshBuild() : undefined;
    if (fresh) {
        try {
            marks = problemMarks(view.state.doc, fresh, problems.items, session.es);
        } catch (error) {
            post({ type: 'log', level: 'warn', message: `problem marks: ${String(error)}` });
        }
    }
    const decorations = marks.map((m) => {
        const attrs = { class: `dc-problem dc-problem-${m.severity}`, title: m.items.map(problemText).join('\n') };
        return m.inline ? Decoration.inline(m.from, m.to, attrs, { mark: m }) : Decoration.node(m.from, m.to, attrs, { mark: m });
    });
    view.dispatch(view.state.tr.setMeta(problemsKey, DecorationSet.create(view.state.doc, decorations)));
    post({ type: 'problemMarks', count: marks.reduce((n, m) => n + m.items.length, 0) });
}

/** The problem marks on the page, in document order (positions as now). */
function shownProblems(state: EditorState): { from: number; to: number; mark: ProblemMark }[] {
    const set = problemsKey.getState(state);
    return (set?.find() ?? [])
        .map((d) => ({ from: d.from, to: d.to, mark: (d.spec as { mark: ProblemMark }).mark }))
        .sort((a, b) => a.from - b.from);
}

// ---------------------------------------------------------------------------------------------
// Sync with a text editor showing the document (spec §11.2): each side follows the other's
// cursor and scrolling, through source offsets of the text the host has.

/** Transactions made to follow the text editor carry this meta: they are not reported back. */
const SYNC_META = 'dcSync';
let syncEnabled = false;
/** The page is following the text editor until then: its scrolling is not reported. */
let syncQuietUntil = 0;
/** The user's last change on the page: scrolling right after it is the editor keeping the cursor in view. */
let lastLocalChangeAt = 0;
let syncTimer: ReturnType<typeof setTimeout> | undefined;
let pendingSync: SyncMode | undefined;
let syncWaiting: SyncMode | undefined;

function scheduleSyncReport(mode: SyncMode): void {
    // While following the text editor, the page's scrolling is that editor's doing; a cursor
    // moved by the user is not (the page's own following carries SYNC_META).
    if (!syncEnabled || (mode === 'scroll' && Date.now() < syncQuietUntil)) {
        return;
    }
    if (mode === 'cursor' || pendingSync === undefined) {
        pendingSync = mode; // a cursor move wins over the scrolling it causes
    }
    if (syncTimer) {
        clearTimeout(syncTimer);
    }
    syncTimer = setTimeout(reportSync, pendingSync === 'cursor' ? 120 : 60);
}

function reportSync(): void {
    syncTimer = undefined;
    const mode = pendingSync;
    pendingSync = undefined;
    if (!mode || !syncEnabled || !session || !view || paused !== undefined) {
        return;
    }
    flush();
    if (session.sync.busy) {
        syncWaiting = mode; // offsets must be those of the host's text: after the acknowledgement
        return;
    }
    const fresh = freshBuild();
    const selection = view.state.selection;
    // A selected element holding others (a map row) is where it starts.
    const cursor = selection instanceof NodeSelection && !selection.node.isAtom ? selection.from : selection.head;
    const pos = mode === 'cursor' ? cursor : topVisiblePosition();
    if (!fresh || pos === undefined) {
        return;
    }
    post({ type: 'sync', version: session.sync.documentVersion, offset: new SourcePositions(view.state.doc, fresh, session.es).offsetOf(pos), mode });
}

/** The document position shown at the top of the page, under the toolbar. */
function topVisiblePosition(): number | undefined {
    if (!view) {
        return undefined;
    }
    const top = Math.max(0, toolbar.getBoundingClientRect().bottom) + 8;
    const box = content.getBoundingClientRect();
    for (const dx of [24, box.width / 3, box.width / 2]) {
        const hit = view.posAtCoords({ left: box.left + dx, top: Math.max(top, box.top + 1) });
        if (hit) {
            return hit.pos;
        }
    }
    return undefined;
}

/** Scroll the page: `pos` at the top, or into the middle when it is out of view. */
function scrollToPosition(pos: number, how: 'top' | 'center', node: boolean): void {
    if (!view) {
        return;
    }
    let rect: { top: number; bottom: number } | undefined;
    const dom = node ? view.nodeDOM(pos) : null;
    if (dom instanceof HTMLElement) {
        rect = dom.getBoundingClientRect();
    } else {
        try {
            rect = view.coordsAtPos(pos);
        } catch {
            return;
        }
    }
    const top = Math.max(0, toolbar.getBoundingClientRect().bottom);
    const bottom = status.getBoundingClientRect().top || window.innerHeight;
    if (how === 'top') {
        window.scrollBy(0, rect.top - top - 8);
    } else if (rect.top < top || rect.bottom > bottom) {
        window.scrollBy(0, rect.top - (top + bottom) / 2);
    }
}

/** Follow the text editor: its cursor (the page's cursor moves there) or its top line. */
function reveal(message: Extract<HostToEditor, { type: 'reveal' }>): void {
    if (!session || !view || paused !== undefined || session.sync.busy || message.version !== session.sync.documentVersion) {
        return; // the offset is for another text
    }
    const fresh = freshBuild();
    if (!fresh) {
        return;
    }
    const target = new SourcePositions(view.state.doc, fresh, session.es).positionOf(message.offset);
    syncQuietUntil = Date.now() + 350;
    if (syncTimer) {
        clearTimeout(syncTimer); // the text editor leads now
        syncTimer = undefined;
        pendingSync = undefined;
    }
    if (message.mode === 'scroll') {
        scrollToPosition(target.pos, 'top', target.node);
        return;
    }
    const doc = view.state.doc;
    const node = target.node ? doc.nodeAt(target.pos) : null;
    const selection = node && ((node.isAtom && !node.isText && NodeSelection.isSelectable(node)) || isMapRow(node, session.es))
        ? NodeSelection.create(doc, target.pos)
        : Selection.near(doc.resolve(target.node ? Math.min(target.pos + 1, doc.content.size) : target.pos));
    view.dispatch(view.state.tr.setSelection(selection).setMeta(SYNC_META, true));
    scrollToPosition(selection instanceof NodeSelection ? selection.from : selection.head, 'center', selection instanceof NodeSelection);
    if (message.focus) {
        view.focus();
    }
}

window.addEventListener('scroll', () => {
    if (Date.now() - lastLocalChangeAt > 300) {
        scheduleSyncReport('scroll');
    }
}, { passive: true });

/** The problem mark at the cursor (the status line shows its message), if any. */
function problemHere(state: EditorState): { from: number; to: number; mark: ProblemMark } | undefined {
    const { from, to } = state.selection;
    return shownProblems(state).find((p) => p.from <= from && to <= p.to && (p.mark.inline ? from < p.to : true));
}

/** Go to the next problem after the cursor (from the start after the last one). */
function nextProblem(): void {
    if (!view) {
        return;
    }
    const all = shownProblems(view.state);
    if (all.length === 0) {
        return;
    }
    const target = all.find((p) => p.from > view!.state.selection.from) ?? all[0];
    const doc = view.state.doc;
    const node = doc.nodeAt(target.from);
    const selection = target.mark.inline
        ? TextSelection.create(doc, target.from, target.to)
        : node && ((node.isAtom && !node.isText) || (session !== undefined && isMapRow(node, session.es)))
            ? NodeSelection.create(doc, target.from) : Selection.near(doc.resolve(Math.min(target.from + 1, doc.content.size)));
    view.dispatch(view.state.tr.setSelection(selection).scrollIntoView());
    view.focus();
}

function editable(): boolean {
    return paused === undefined && session !== undefined && !session.readOnly;
}

function start(message: Extract<HostToEditor, { type: 'init' }>): void {
    let es = schemas.get(message.grammar);
    if (!es) {
        es = buildEditorSchema(message.grammar, { labels: labelsFor(message.locale) });
        schemas.clear();
        schemas.set(message.grammar, es);
    }
    const cmds = new DitaCommands(es);
    const tables = new TableCommands(es);
    const images = new ImageCommands(es, cmds);
    const links = new LinkCommands(es, cmds);
    const labels = labelsFor(message.locale);
    const maps = new MapCommands(es, cmds);
    const rel = new RelTableCommands(es, cmds);
    const page: MapPage = {
        es, labels, maps, rel,
        openTarget: (target, pos) => openRowTarget(target, pos),
        addReference: () => void addReference(),
        changeTarget: () => void pickRowTarget(),
        showMarkup: () => showMarkup,
        editable,
    };
    applySettings(message.settings);
    let cst: CstDocument | undefined;
    try {
        cst = parse(message.text);
        paused = undefined;
    } catch (error) {
        paused = pauseMessage(error, message.text, labels);
    }
    const built = cst ? build(cst, es) : build(parse('<topic id="placeholder"><title/></topic>'), es);
    session = {
        es, cmds, tables, images, links, base: built.base, sync: new EditSync(message.text, message.version), labels,
        grammarLabel: message.grammarLabel, fileName: message.fileName, readOnly: message.readOnly,
        map: isMapDocument(built.doc, es), maps, rel, page,
    };
    const state = EditorState.create({ doc: built.doc, plugins: plugins(es, cmds, tables, page) });
    if (view) {
        view.updateState(state);
    } else {
        view = new EditorView({ mount: content }, {
            state,
            editable,
            dispatchTransaction,
            clipboardSerializer: clipboardSerializer(es.schema),
            clipboardParser: clipboardParser(es),
            attributes: { spellcheck: 'true', 'aria-label': message.fileName },
            handlePaste: (_v, event) => pasteImages(event),
            handleDrop: (v, event, _slice, moved) => dropImages(v, event, moved),
            nodeViews: { ...resolvedNodeViews(es), ...mapNodeViews(page) },
        });
    }
    view.setProps({ clipboardSerializer: clipboardSerializer(es.schema), clipboardParser: clipboardParser(es), nodeViews: { ...resolvedNodeViews(es), ...mapNodeViews(page) } });
    fixMapSelection();
    renderToolbar();
    showBanner();
    docStamp++;
    showProblems();
    showResolved();
    updateUi();
    scheduleSelectionReport(true);
}

function pauseMessage(error: unknown, text: string, labels: Labels): string {
    if (error instanceof ParseError) {
        const line = text.slice(0, error.offset).split('\n').length;
        return format(labels.ui.paused, line, error.reason);
    }
    return String(error);
}

/** The document changed outside the editor: rebuild from its text, keeping the cursor nearby. */
function rebuild(text: string): void {
    if (!session || !view) {
        return;
    }
    let cst: CstDocument;
    try {
        cst = parse(text);
    } catch (error) {
        paused = pauseMessage(error, text, session.labels);
        view.setProps({ editable });
        showBanner();
        updateUi();
        return;
    }
    paused = undefined;
    const built = build(cst, session.es);
    session.base = built.base;
    const folds = foldPaths(view.state);
    syncQuietUntil = Date.now() + 350; // restoring the scroll position is not the user scrolling
    const scroll = window.scrollY;
    const at = Math.min(view.state.selection.from, built.doc.content.size);
    const state = EditorState.create({
        doc: built.doc,
        selection: Selection.near(built.doc.resolve(at)),
        plugins: plugins(session.es, session.cmds, session.tables, session.page),
    });
    view.updateState(state);
    view.setProps({ editable });
    session.map = isMapDocument(built.doc, session.es);
    restoreFolds(view, folds, session.es);
    fixMapSelection();
    window.scrollTo(0, scroll);
    showBanner();
    docStamp++;
    showProblems(); // the new state has none yet
    showResolved();
    updateUi();
    scheduleSelectionReport(true);
}

// ---------------------------------------------------------------------------------------------
// Changes → host

let syncScheduled = false;
let uiScheduled = false;

function dispatchTransaction(tr: Transaction): void {
    if (!view) {
        return;
    }
    view.updateState(view.state.apply(tr));
    if (tr.docChanged) {
        docStamp++;
        scheduleSync();
    }
    if ((tr.docChanged || tr.selectionSet) && !tr.getMeta(SYNC_META)) {
        lastLocalChangeAt = Date.now();
        scheduleSyncReport('cursor');
    }
    scheduleUi();
    scheduleSelectionReport();
}

// ---------------------------------------------------------------------------------------------
// Selection → Properties pane (host), and attribute changes back

/** Changes with every document change: positions reported to the host are valid for one stamp. */
let docStamp = 0;
let selectionTimer: ReturnType<typeof setTimeout> | undefined;
let lastReported = '';

function scheduleSelectionReport(force = false): void {
    if (force) {
        lastReported = '';
    }
    if (selectionTimer) {
        clearTimeout(selectionTimer);
    }
    selectionTimer = setTimeout(() => {
        selectionTimer = undefined;
        reportSelection();
    }, 80);
}

/** The elements around the cursor, innermost first (formatting marks first of all). */
function selectionChain(state: EditorState): SelectedElement[] {
    if (!session) {
        return [];
    }
    const es = session.es;
    const out: SelectedElement[] = [];
    const editableNow = editable();
    const entry = (node: PMNode, pos: number): void => {
        const name = es.role(node.type)?.element ?? (typeof node.attrs.name === 'string' && node.attrs.name ? node.attrs.name : undefined);
        if (name && Array.isArray(node.attrs.xml)) {
            out.push({ name, pos, xml: node.attrs.xml as [string, string][], editable: editableNow, reason: editableNow ? undefined : 'readOnly' });
        }
    };
    const selection = state.selection;
    if (selection instanceof NodeSelection) {
        entry(selection.node, selection.from);
    } else {
        for (const mark of selection.$from.marks()) {
            const name = es.markElement(mark.type);
            if (name) {
                out.push({ name, pos: -1, xml: [], editable: false, reason: 'formatting' });
            }
        }
    }
    const $from = selection.$from;
    for (let d = $from.depth; d >= 1; d--) {
        entry($from.node(d), $from.before(d));
    }
    return out;
}

function reportSelection(): void {
    if (!view || !session) {
        return;
    }
    const chain = selectionChain(view.state);
    const key = JSON.stringify([docStamp, chain]);
    if (key === lastReported) {
        return;
    }
    lastReported = key;
    post({ type: 'selection', stamp: docStamp, chain });
}

function setAttributes(message: Extract<HostToEditor, { type: 'setAttributes' }>): void {
    const node = view && editable() && message.pos >= 0 && message.pos < view.state.doc.content.size ? view.state.doc.nodeAt(message.pos) : null;
    const name = node && session ? (session.es.role(node.type)?.element ?? node.attrs.name) : undefined;
    // Positions are those of `stamp`; after a later change, the node must still be the element
    // the pane showed, with the attributes it showed.
    const same = node !== null && name === message.name
        && (message.stamp === docStamp || JSON.stringify(node.attrs.xml) === JSON.stringify(message.before));
    if (!view || !node || !Array.isArray(node.attrs.xml) || !same) {
        scheduleSelectionReport(true); // stale: tell the pane what is there now
        return;
    }
    view.dispatch(view.state.tr.setNodeMarkup(message.pos, undefined, { ...node.attrs, xml: message.xml }));
}

/**
 * Write the change soon, once per burst of transactions. A timer task, not an animation
 * frame: frames do not run in a hidden webview, and a change typed just before switching
 * tabs must still reach the document.
 */
function scheduleSync(): void {
    if (syncScheduled) {
        return;
    }
    syncScheduled = true;
    setTimeout(() => {
        syncScheduled = false;
        flush();
    }, 0);
}

function flush(): void {
    if (!session || !view || paused !== undefined) {
        return;
    }
    let text: string;
    try {
        text = serializeDocument(view.state.doc, session.base);
    } catch (error) {
        post({ type: 'log', level: 'error', message: `serialization failed: ${String(error)}` });
        return;
    }
    const edit = session.sync.local(text);
    if (edit) {
        post(edit);
    }
    updateStatus();
}

/** Source offset of the cursor in the current text (for Open Source). */
function cursorOffset(): number | undefined {
    if (!session || !view) {
        return undefined;
    }
    const marker = '';
    try {
        const tr = view.state.tr.insertText(marker, view.state.selection.from);
        const k = serializeDocument(tr.doc, session.base).indexOf(marker);
        return k === -1 ? undefined : k;
    } catch {
        return undefined;
    }
}

// ---------------------------------------------------------------------------------------------
// Clipboard: structure and attributes survive copy/paste inside the editor; pasted HTML maps
// to the nearest DITA elements; pasted elements are new (no @id, no source).

function decorate(spec: DOMOutputSpec, attrs: Record<string, string>): DOMOutputSpec {
    if (!Array.isArray(spec)) {
        return spec;
    }
    const [tag, second, ...rest] = spec as unknown as [string, unknown, ...unknown[]];
    if (second && typeof second === 'object' && !Array.isArray(second) && !(second instanceof Node)) {
        return [tag, { ...(second as Record<string, string>), ...attrs }, ...rest] as unknown as DOMOutputSpec;
    }
    return [tag, attrs, ...(second === undefined ? [] : [second]), ...rest] as unknown as DOMOutputSpec;
}

function clipboardSerializer(schema: Schema): DOMSerializer {
    const base = DOMSerializer.fromSchema(schema);
    const nodes: Record<string, (node: PMNode) => DOMOutputSpec> = {};
    for (const [name, render] of Object.entries(base.nodes)) {
        nodes[name] = (node) => {
            const attrs: Record<string, string> = { 'data-pm': name };
            if (node.attrs.xml !== undefined) {
                attrs['data-pm-xml'] = JSON.stringify(node.attrs.xml);
            }
            if (node.isAtom && !node.isText) {
                const raw = rawOf(node);
                if (raw !== undefined) {
                    attrs['data-pm-raw'] = raw;
                }
                attrs['data-pm-attrs'] = JSON.stringify({ name: node.attrs.name, text: node.attrs.text, view: node.attrs.view });
            }
            return decorate(render(node), attrs);
        };
    }
    const marks: Record<string, (mark: import('prosemirror-model').Mark, inline: boolean) => DOMOutputSpec> = {};
    for (const [name, render] of Object.entries(base.marks)) {
        marks[name] = (mark, inline) => decorate(render(mark, inline), { 'data-pm-mark': name });
    }
    return new DOMSerializer(nodes, marks);
}

/** Source of an atom: its element in the loaded source, or what it was pasted with. */
function rawOf(node: PMNode): string | undefined {
    if (typeof node.attrs.raw === 'string') {
        return node.attrs.raw;
    }
    const src = node.attrs.src as string | null | undefined;
    const el = src && session ? session.base.index.element(src) : undefined;
    return el ? session!.base.source.slice(el.range.start, el.range.end) : undefined;
}

function json<T>(value: string | undefined, fallback: T): T {
    try {
        return value ? (JSON.parse(value) as T) : fallback;
    } catch {
        return fallback;
    }
}

function clipboardParser(es: EditorSchema): PMDOMParser {
    const schema = es.schema;
    const rules: TagParseRule[] = [];
    for (const type of Object.values(schema.nodes)) {
        if (type.name === 'doc' || type.name === 'text') {
            continue;
        }
        rules.push({
            tag: `[data-pm="${type.name}"]`,
            node: type.name,
            priority: 100,
            getAttrs: (dom: HTMLElement) => {
                const extra = json<Record<string, unknown>>(dom.dataset.pmAttrs, {});
                const xml = json<[string, string][]>(dom.dataset.pmXml, []).filter(([key]) => key !== 'id');
                return type.spec.attrs ? {
                    ...(type.spec.attrs.src ? { src: null, xml, view: extra.view ?? null, raw: dom.dataset.pmRaw ?? null } : {}),
                    ...(type.spec.attrs.name ? { name: extra.name ?? '' } : {}),
                    ...(type.spec.attrs.text ? { text: extra.text ?? '' } : {}),
                } : null;
            },
        });
    }
    for (const type of Object.values(schema.marks)) {
        rules.push({ tag: `[data-pm-mark="${type.name}"]`, mark: type.name, priority: 100 });
    }
    // Plain HTML from other applications.
    const block = (tag: string, element: string, variant: 'text' | 'main' = 'text') => {
        const type = es.nodeType(element, 'block', variant) ?? es.nodeType(element, 'block');
        if (type) {
            rules.push({ tag, node: type.name, getAttrs: () => ({ src: null, xml: [], view: null }) });
        }
    };
    block('p', 'p');
    block('div', 'p');
    for (const h of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
        block(h, 'p');
    }
    block('li', 'li');
    block('ul', 'ul', 'main');
    block('ol', 'ol', 'main');
    block('pre', 'codeblock');
    block('blockquote', 'lq', 'main');
    const mark = (tag: string, element: string) => {
        const type = es.markType(element);
        if (type) {
            rules.push({ tag, mark: type.name });
        }
    };
    for (const [tags, element] of [[['strong', 'b'], 'b'], [['em', 'i'], 'i'], [['u'], 'u'], [['code', 'tt'], 'codeph'], [['sup'], 'sup'], [['sub'], 'sub']] as [string[], string][]) {
        for (const tag of tags) {
            mark(tag, element);
        }
    }
    return new PMDOMParser(schema, rules);
}

// ---------------------------------------------------------------------------------------------
// Toolbar, status, banner

function t(key: string): string {
    return session?.labels.ui[key] ?? key;
}

/** A toolbar button; `refocus` false for buttons that open a menu (the menu takes the keyboard). */
function button(label: string, title: string, run: () => void, id?: string, refocus = true): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dc-btn';
    b.textContent = label;
    b.title = title;
    if (id) {
        b.dataset.id = id;
    }
    // Keep the editor's selection: act on mousedown without taking focus.
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', () => {
        run();
        if (refocus) {
            view?.focus();
        }
    });
    return b;
}

function run(command: Command): void {
    if (view && editable()) {
        command(view.state, view.dispatch, view);
    }
}

function markButton(element: string, label: string, title: string): HTMLButtonElement | undefined {
    const type = session?.es.markType(element);
    return type ? button(label, title, () => run(toggleMark(type)), `mark:${element}`) : undefined;
}

function renderToolbar(): void {
    if (!session) {
        return;
    }
    const s = session;
    if (s.map) {
        renderMapToolbar();
        return;
    }
    const items: (HTMLElement | undefined)[] = [
        button('↶', t('undo'), () => run(undo), 'undo'),
        button('↷', t('redo'), () => run(redo), 'redo'),
        styleSelect(),
        markButton('b', 'B', `${t('bold')} (Ctrl+B)`),
        markButton('i', 'I', `${t('italic')} (Ctrl+I)`),
        markButton('u', 'U', `${t('underline')} (Ctrl+U)`),
        markButton('codeph', '</>', `${t('code')} (Ctrl+E)`),
        markButton('sup', 'x²', t('superscript')),
        markButton('sub', 'x₂', t('subscript')),
        button('• ≡', t('bulletList'), () => run(listToggle('ul')), 'list:ul'),
        button('1. ≡', t('numberedList'), () => run(listToggle('ol')), 'list:ol'),
        button('⇤', `${t('outdent')} (Shift+Tab)`, () => run(s.cmds.outdentItem), 'outdent'),
        button('⇥', `${t('indent')} (Tab)`, () => run(s.cmds.indentItem), 'indent'),
        button(`${t('insert')} ▾`, t('insert'), () => toggleToolbarMenu('insert', insertItems), 'insert', false),
        button(`▦ ${t('table')} ▾`, t('table'), () => toggleToolbarMenu('table', tableItems), 'table', false),
        button('🖼 ▾', t('image'), () => toggleToolbarMenu('image', imageItems), 'image', false),
        button('🔗', `${t('link')} (Ctrl+K)`, () => void pickAndSetLink(), 'link', false),
        Object.assign(document.createElement('span'), { className: 'dc-spacer' }),
        button(showMarkup ? t('hideMarkup') : t('showMarkup'), t('showMarkup'), toggleMarkup, 'markup'),
        button(t('properties'), t('properties'), () => post({ type: 'command', command: 'properties' })),
        button(t('openSource'), t('openSource'), () => post({ type: 'openSource', offset: cursorOffset() })),
        button(t('preview'), t('preview'), () => post({ type: 'command', command: 'preview' })),
    ];
    toolbar.replaceChildren(...items.filter((i): i is HTMLElement => i !== undefined));
    updateUi();
}

/** A map's toolbar: what its rows need (formatting, lists, tables, images and links are a topic's). */
function renderMapToolbar(): void {
    if (!session) {
        return;
    }
    const s = session;
    const items: HTMLElement[] = [
        button('↶', t('undo'), () => run(undo), 'undo'),
        button('↷', t('redo'), () => run(redo), 'redo'),
        button(`＋ ${t('addReferenceShort')}`, t('addReference'), () => void addReference(), 'addReference', false),
        button(`${t('insert')} ▾`, t('insert'), () => toggleToolbarMenu('insert', insertItems), 'insert', false),
        button(`▦ ${t('relTableShort')} ▾`, t('relTable'), () => toggleToolbarMenu('reltable', relTableItems), 'reltable', false),
        button('⇤', `${t('outdentRow')} (Shift+Tab)`, () => view && editable() && moveRow(view, s.es, s.maps.outdentRow), 'outdentRow'),
        button('⇥', `${t('indentRow')} (Tab)`, () => view && editable() && moveRow(view, s.es, s.maps.indentRow), 'indentRow'),
        button('⊞', t('expandAll'), () => view && setAllFolds(view, s.es, false), 'expandAll'),
        button('⊟', t('collapseAll'), () => view && setAllFolds(view, s.es, true), 'collapseAll'),
        Object.assign(document.createElement('span'), { className: 'dc-spacer' }),
        button(showMarkup ? t('hideMarkup') : t('showMarkup'), t('showMarkup'), toggleMarkup, 'markup'),
        button(t('properties'), t('properties'), () => post({ type: 'command', command: 'properties' })),
        button(t('openSource'), t('openSource'), () => post({ type: 'openSource', offset: cursorOffset() })),
    ];
    toolbar.replaceChildren(...items);
    updateUi();
}

function toggleMarkup(): void {
    showMarkup = !showMarkup;
    content.classList.toggle('dc-show-markup', showMarkup);
    fixMapSelection(); // the cursor was in what is hidden now
    renderToolbar();
}

function listToggle(list: string): Command {
    return (state, dispatch, v) => {
        if (!session) {
            return false;
        }
        const item = session.cmds.itemAt(state.selection.$from);
        if (item) {
            const listNode = state.selection.$from.node(item.depth - 1);
            if (session.es.role(listNode.type)?.element === list) {
                return session.cmds.unwrapList(state, dispatch, v);
            }
        }
        return session.cmds.wrapInList(list)(state, dispatch, v);
    };
}

function styleSelect(): HTMLSelectElement {
    const select = document.createElement('select');
    select.className = 'dc-select';
    select.title = t('style');
    select.dataset.id = 'style';
    select.addEventListener('change', () => {
        if (session && select.value) {
            run(session.cmds.setBlockType(select.value));
        }
        view?.focus();
    });
    return select;
}

function currentElement(state: EditorState): string | undefined {
    const parent = state.selection.$from.parent;
    return session?.es.role(parent.type)?.element ?? undefined;
}

// ---------------------------------------------------------------------------------------------
// Menus (spec §13.3): the toolbar's Insert and Table menus and the right-click menu, built from
// src/shared/editor/contextMenu.ts and shown by ./menu.ts.

function menuContext(): MenuContext | undefined {
    return session && view
        ? {
            es: session.es, cmds: session.cmds, tables: session.tables, images: session.images, links: session.links, editable: editable(),
            reuse: selectedReuse() !== undefined, problem: problemHere(view.state) !== undefined,
            row: rowContext(), maps: session.map ? session.maps : undefined, relTables: session.map ? session.rel : undefined,
        }
        : undefined;
}

/** Run a menu item: its command, or what the page does for it. */
function runMenuItem(item: Extract<MenuItem, { kind: 'item' }>): void {
    if (!view) {
        return;
    }
    view.focus(); // the selection the menu was opened on, back in the DOM
    if (item.command) {
        if (session?.map && (item.id === 'row/indent' || item.id === 'row/outdent') && editable()) {
            moveRow(view, session.es, item.command);
            return;
        }
        run(item.command);
        return;
    }
    switch (item.action) {
        case 'cut':
        case 'copy':
            // Through the editor's own clipboard handling: elements and attributes are kept.
            document.execCommand(item.action);
            break;
        case 'paste':
            void pasteFromClipboard();
            break;
        case 'attributes':
            post({ type: 'command', command: 'properties' });
            break;
        case 'showInSource':
            post({ type: 'openSource', offset: cursorOffset() });
            break;
        case 'reuseOpen':
        case 'reuseCopy': {
            const selected = selectedReuse();
            if (selected) {
                reuseAction(selected.node, item.action === 'reuseOpen' ? 'open' : 'copy');
            }
            break;
        }
        case 'imageInline':
            void pickAndInsertImage('inline');
            break;
        case 'imageBreak':
            void pickAndInsertImage('break');
            break;
        case 'imageFigure':
            void pickAndInsertImage('figure');
            break;
        case 'imageReplace':
            void replaceImage();
            break;
        case 'imageAlt':
            void editAltText();
            break;
        case 'link':
            void pickAndSetLink();
            break;
        case 'linkOpen': {
            const target = session?.links.current(view.state);
            if (target) {
                post({ type: 'openLink', target });
            }
            break;
        }
        case 'quickFix':
            void showQuickFixes(lastMenuAt ?? cursorPlace(), true);
            break;
        case 'rowOpen': {
            const row = session ? selectedRow(view.state, session.es) : undefined;
            const target = row && session ? mapRowTarget(row.node, session.es) : undefined;
            if (target && row) {
                openRowTarget(target, row.pos);
            }
            break;
        }
        case 'rowTarget':
            void pickRowTarget();
            break;
        case 'rowLabel': {
            const row = session ? selectedRow(view.state, session.es) : undefined;
            if (row) {
                editRowLabel(view, row.pos);
            }
            break;
        }
        case 'addReference':
            void addReference();
            break;
    }
}

// ---------------------------------------------------------------------------------------------
// Maps (spec §13.8): rows (./mapView.ts), their targets opened beside.

function rowContext(): MenuContext['row'] {
    const row = session && view ? selectedRow(view.state, session.es) : undefined;
    return row && session ? { target: mapRowTarget(row.node, session.es) !== undefined } : undefined;
}

/** Open a row's target; with the row's place in the text, the topic is then shown in that place of the map (spec §13.8 M4). */
function openRowTarget(target: MapRowTarget, pos?: number): void {
    let from: { from: number; version: number } | undefined;
    if (session && view && pos !== undefined) {
        flush();
        const fresh = session.sync.busy ? undefined : freshBuild();
        if (fresh) {
            from = { from: new SourcePositions(view.state.doc, fresh, session.es).offsetOf(pos), version: session.sync.documentVersion };
        }
    }
    post({ type: 'openLink', target, ...from });
}

/** The map context the topic is shown in (spec §13.8 M4), for the status line. */
let mapContextStatus: { label: string; title: string } | undefined;

/**
 * A row's title shown at once (the target chosen in the picker), until the host resolves the
 * map again: the row's resolved item replaced on the page.
 */
function showRowTitle(pos: number, title: string | undefined): void {
    if (!view) {
        return;
    }
    const node = view.state.doc.nodeAt(pos);
    const set = resolvedKey.getState(view.state) ?? DecorationSet.empty;
    if (!node) {
        return;
    }
    const old = set.find(pos, pos + node.nodeSize).filter((d) => d.from === pos);
    const item: ResolvedItem = { offset: -1, kind: 'row', text: title };
    const next = set.remove(old).add(view.state.doc, title ? [Decoration.node(pos, pos + node.nodeSize, {}, { resolved: item })] : []);
    view.dispatch(view.state.tr.setMeta(resolvedKey, next));
}

/** Change target… (Ctrl+K on a row): the host's picker (keys, topics, maps), then the row's target attributes. */
async function pickRowTarget(): Promise<void> {
    if (!session || !view || !editable()) {
        return;
    }
    const row = selectedRow(view.state, session.es);
    if (!row || !session.maps.canTarget(row.node)) {
        return;
    }
    const before = view.state;
    const reply = await askHost<Extract<HostToEditor, { type: 'link' }>>((request) => ({
        type: 'pickLink', request, mode: 'map', current: mapRowTarget(row.node, session!.es),
    }));
    if (!reply.target || !session || !view) {
        view?.focus();
        return;
    }
    if (view.state.doc !== before.doc) {
        noteStatus(t('rowStale'));
        return;
    }
    view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, row.pos)));
    run(session.maps.setTarget(reply.target));
    showRowTitle(row.pos, reply.target.title);
    view.focus();
}

/** Add reference…: the host's picker, then a new reference after the selected row (or the cursor's block). */
async function addReference(): Promise<void> {
    if (!session || !view || !editable()) {
        return;
    }
    if (!session.maps.insertReference()(view.state)) {
        noteStatus(t('referenceNotHere'));
        return;
    }
    const before = view.state;
    const reply = await askHost<Extract<HostToEditor, { type: 'link' }>>((request) => ({ type: 'pickLink', request, mode: 'map' }));
    if (!reply.target || !session || !view) {
        view?.focus();
        return;
    }
    if (view.state.doc !== before.doc) {
        noteStatus(t('rowStale'));
        return;
    }
    if (!view.state.selection.eq(before.selection)) {
        view.dispatch(view.state.tr.setSelection(before.selection));
    }
    run(session.maps.insertReference(reply.target));
    const added = selectedRow(view.state, session.es);
    if (added) {
        showRowTitle(added.pos, reply.target.title);
    }
    view.focus();
}

/** In a map, the cursor is never left in metadata hidden on the page: the row holding it is selected. */
function fixMapSelection(): void {
    if (!view || !session?.map || showMarkup) {
        return;
    }
    const fix = hiddenMetadataSelection(view.state, session.es);
    if (fix) {
        view.dispatch(view.state.tr.setSelection(fix));
    }
}

// ---------------------------------------------------------------------------------------------
// Quick fixes (spec §11.1): the code actions VS Code offers for the problems at the cursor (the
// language server's, DitaCraft AI's), listed by the host. A fix that only edits the topic comes
// back as text edits, made on the page as its own change (src/shared/editor/sourceChange.ts):
// undo on the page takes it back. Any other fix — or one the page cannot make — the host
// applies to the document, and the page follows as after a change in the text editor.

/** A note shown in the status line for a few seconds. */
let statusNote: { text: string; until: number } | undefined;

function noteStatus(text: string): void {
    statusNote = { text, until: Date.now() + 5000 };
    updateStatus();
    setTimeout(updateStatus, 5100);
}

/** Below the cursor (menus opened from the keyboard). */
function cursorPlace(): { x: number; y: number } {
    const coords = view!.coordsAtPos(view!.state.selection.head);
    return { x: coords.left, y: coords.bottom + 2 };
}

/** Quick fixes asked for while an edit was in flight: listed after its acknowledgement. */
let fixQueued: { at: MenuOptions['at']; keyboard: boolean } | undefined;

/** The fixes for the problem at the cursor, as the host lists them (undefined: wait, or no problem there). */
async function listQuickFixes(): Promise<{ message: string; reply: Extract<HostToEditor, { type: 'quickFixes' }> } | undefined> {
    if (!session || !view || !problems) {
        return undefined;
    }
    if (problemsWaiting) {
        showProblems();
    }
    const here = problemHere(view.state);
    if (!here) {
        noteStatus(t('noProblemHere'));
        return undefined;
    }
    const listed = problems;
    const indices = here.mark.items.map((item) => listed.items.indexOf(item)).filter((i) => i >= 0);
    const reply = await askHost<Extract<HostToEditor, { type: 'quickFixes' }>>((request) => ({ type: 'quickFixes', request, version: listed.version, problems: indices }));
    return { message: here.mark.items[0].message, reply };
}

/** Ctrl+., Quick Fix… (right-click), the problem in the status line: the fixes in a menu. */
async function showQuickFixes(at: MenuOptions['at'], keyboard: boolean): Promise<void> {
    if (!session || !view || !editable()) {
        return;
    }
    flush();
    if (session.sync.busy) {
        fixQueued = { at, keyboard }; // the host's problems are for the text it has: after the acknowledgement
        return;
    }
    const listed = await listQuickFixes();
    if (!listed || !view) {
        return;
    }
    const { reply } = listed;
    const short = listed.message.length > 90 ? `${listed.message.slice(0, 89)}…` : listed.message;
    const items: MenuItem[] = [{ kind: 'heading', label: short }];
    if (reply.error !== undefined || !reply.fixes || reply.fixes.length === 0) {
        const label = reply.error === undefined ? t('noQuickFixes') : reply.error === 'stale' ? t('quickFixStale') : format(t('quickFixFailed'), reply.error);
        items.push({ kind: 'item', id: 'fix/none', label, enabled: false });
    } else {
        items.push(...reply.fixes.map((fix): MenuItem => ({ kind: 'item', id: `fix/${fix.id}`, label: `${fix.preferred ? '★ ' : ''}${fix.title}`, enabled: true })));
    }
    showMenu(items, { at, focusFirst: keyboard, run: (item) => void makeQuickFix(Number(item.id.slice('fix/'.length)), item.label), onClose: refocusAfterMenu });
}

/** Make fix `id` of the list the host last sent. */
async function makeQuickFix(id: number, title: string): Promise<void> {
    if (!session || !view || !editable()) {
        return;
    }
    flush();
    const version = session.sync.documentVersion;
    if (session.sync.busy) {
        noteStatus(t('quickFixStale'));
        return;
    }
    const failed = (error: string): void => noteStatus(error === 'stale' ? t('quickFixStale') : format(t('quickFixFailed'), error));
    const reply = await askHost<Extract<HostToEditor, { type: 'quickFixResult' }>>((request) => ({ type: 'quickFix', request, id, version }));
    if (reply.error !== undefined) {
        failed(reply.error);
        return;
    }
    if (reply.edits && session && view) {
        if (session.sync.busy || session.sync.documentVersion !== version) {
            failed('stale');
            return;
        }
        const s = session;
        const fresh = freshBuild();
        const tr = fresh ? sourceChangeTransaction(view.state, fresh, reply.edits, s.es, s.base, (text) => build(parse(text), s.es)) : undefined;
        if (tr) {
            view.dispatch(tr.scrollIntoView());
            view.focus();
            noteStatus(format(t('quickFixApplied'), title.replace(/^★ /, '')));
            return;
        }
        // Not a change the page can make (the DOCTYPE, a change of layout only…): the host applies it.
        const direct = await askHost<Extract<HostToEditor, { type: 'quickFixResult' }>>((request) => ({ type: 'quickFix', request, id, version, direct: true }));
        if (direct.error !== undefined) {
            failed(direct.error);
            return;
        }
    }
    noteStatus(format(t('quickFixApplied'), title.replace(/^★ /, '')));
}

// ---------------------------------------------------------------------------------------------
// Links: the host's picker chooses the target (src/editor/linkPicker.ts), the page puts it in
// the document (src/shared/editor/links.ts).

/** Link… / Change link target… (Ctrl+K). */
async function pickAndSetLink(): Promise<void> {
    if (!session || !view || !editable()) {
        return;
    }
    const links = session.links;
    if (!links.setLink()(view.state)) {
        status.title = t('linkNotHere');
        return;
    }
    const before = view.state;
    const reply = await askHost<Extract<HostToEditor, { type: 'link' }>>((request) => ({ type: 'pickLink', request, current: links.current(before) }));
    if (!reply.target || !session || !view) {
        view?.focus();
        return;
    }
    // Where the picker was opened from, when nothing changed meanwhile.
    if (view.state.doc === before.doc && !view.state.selection.eq(before.selection)) {
        view.dispatch(view.state.tr.setSelection(before.selection));
    }
    run(links.setLink(reply.target));
    view.focus();
}

// ---------------------------------------------------------------------------------------------
// Images: the host picks or saves the file (it knows the file system and the topic's folder),
// the page inserts the image where the cursor is (src/shared/editor/images.ts).

let hostRequest = 0;
const hostReplies = new Map<number, (message: HostToEditor) => void>();

/** Send a request to the host; resolves with its answer (`images` or `text`). */
function askHost<T extends HostToEditor>(make: (request: number) => EditorToHost): Promise<T> {
    const request = ++hostRequest;
    return new Promise((resolve) => {
        hostReplies.set(request, (message) => resolve(message as T));
        post(make(request));
    });
}

function hostReply(message: Extract<HostToEditor, { type: 'images' | 'text' | 'link' | 'quickFixes' | 'quickFixResult' }>): void {
    const resolve = hostReplies.get(message.request);
    hostReplies.delete(message.request);
    resolve?.(message);
}

/** Insert images at the cursor, one after the other. */
function insertImages(placement: ImagePlacement, hrefs: string[], alt?: string): void {
    if (!session || !view) {
        return;
    }
    for (const href of hrefs) {
        let command = session.images.insert(placement, { href, alt });
        if (placement === 'break' && !command(view.state)) {
            command = session.images.insert('inline', { href, alt }); // only the text takes an image here
        }
        if (!editable() || !command(view.state)) {
            post({ type: 'log', level: 'warn', message: t('imageNotHere') });
            status.title = t('imageNotHere');
            return;
        }
        command(view.state, view.dispatch, view);
    }
    view.focus();
}

async function pickAndInsertImage(placement: ImagePlacement): Promise<void> {
    if (!session || !editable()) {
        return;
    }
    const reply = await askHost<Extract<HostToEditor, { type: 'images' }>>((request) => ({ type: 'pickImage', request, askAlt: true }));
    if (reply.error) {
        status.title = format(t('imageFailed'), reply.error);
    }
    insertImages(placement, reply.hrefs, reply.alt);
}

async function replaceImage(): Promise<void> {
    const image = session && view ? session.images.selectedImage(view.state) : undefined;
    if (!image) {
        return;
    }
    const near = (image.node.attrs.xml as [string, string][]).find(([n]) => n === 'href')?.[1];
    const reply = await askHost<Extract<HostToEditor, { type: 'images' }>>((request) => ({ type: 'pickImage', request, askAlt: false, near }));
    if (reply.hrefs.length > 0 && session && view && view.state.doc.nodeAt(image.pos) === image.node) {
        view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, image.pos)));
        run(session.images.setHref(reply.hrefs[0]));
    }
}

async function editAltText(): Promise<void> {
    const image = session && view ? session.images.selectedImage(view.state) : undefined;
    if (!image) {
        return;
    }
    const current = (image.node.attrs.view as { alt?: string } | null)?.alt ?? '';
    const reply = await askHost<Extract<HostToEditor, { type: 'text' }>>((request) => ({
        type: 'askText', request, prompt: t('imageAltPrompt'), value: current, placeHolder: t('imageAltPlaceholder'),
    }));
    // Applied to the image it was asked for, if it is still there.
    if (reply.value !== undefined && session && view && view.state.doc.nodeAt(image.pos) === image.node) {
        view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, image.pos)));
        run(session.images.setAlt(reply.value, rawOf(image.node)));
    }
}

/** Image bytes (pasted, or dropped from outside VS Code): saved by the host next to the topic, then inserted. */
async function insertImageData(items: { data: string; mime: string; name?: string }[]): Promise<void> {
    for (const item of items) {
        const reply = await askHost<Extract<HostToEditor, { type: 'images' }>>((request) => ({ type: 'saveImage', request, ...item }));
        if (reply.error) {
            status.title = format(t('imageFailed'), reply.error);
        }
        insertImages('break', reply.hrefs);
    }
}

function readFile(file: File): Promise<{ data: string; mime: string; name: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ data: String(reader.result).replace(/^data:[^,]*,/, ''), mime: file.type, name: file.name });
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

/** Paste: an image on the clipboard (a screenshot) is saved and inserted; anything else pastes as usual. */
function pasteImages(event: ClipboardEvent): boolean {
    const data = event.clipboardData;
    if (!session || !editable() || !data || data.getData('text/html').includes('data-pm=')) {
        return false; // elements copied in the editor keep their own structure
    }
    const files = [...data.files].filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) {
        return false;
    }
    void Promise.all(files.map(readFile)).then(insertImageData);
    return true;
}

/** Drop: image files from VS Code's Explorer (hold Shift) are linked; image files from elsewhere are saved first. */
function dropImages(v: EditorView, event: DragEvent, moved: boolean): boolean {
    const transfer = event.dataTransfer;
    if (moved || !session || !editable() || !transfer) {
        return false;
    }
    const uris = droppedUris((type) => {
        try {
            return transfer.getData(type);
        } catch {
            return '';
        }
    }).filter((u) => isImagePath(u));
    const files = [...transfer.files].filter((f) => f.type.startsWith('image/'));
    if (uris.length === 0 && files.length === 0) {
        return false;
    }
    const hit = v.posAtCoords({ left: event.clientX, top: event.clientY });
    if (hit) {
        v.dispatch(v.state.tr.setSelection(Selection.near(v.state.doc.resolve(hit.pos))));
    }
    if (uris.length > 0) {
        void askHost<Extract<HostToEditor, { type: 'images' }>>((request) => ({ type: 'imageFiles', request, uris }))
            .then((reply) => insertImages('break', reply.hrefs));
    } else {
        void Promise.all(files.map(readFile)).then(insertImageData);
    }
    return true;
}

/** Open (or close) the menu of toolbar button `anchor`. */
function toggleToolbarMenu(anchor: string, items: (state: EditorState, ctx: MenuContext) => MenuItem[]): void {
    const button = toolbar.querySelector<HTMLElement>(`[data-id="${anchor}"]`);
    const open = openMenu();
    if (open && open.anchor === button) {
        closeMenu();
        view?.focus();
        return;
    }
    const ctx = menuContext();
    if (!button || !view || !ctx) {
        return;
    }
    showMenu(items(view.state, ctx), { at: { below: button.getBoundingClientRect() }, anchor: button, focusFirst: false, run: runMenuItem, onClose: refocusAfterMenu });
}

/** A menu closed with Escape leaves focus nowhere: back to the editor. */
function refocusAfterMenu(): void {
    setTimeout(() => {
        if (view && (document.activeElement === document.body || document.activeElement === null)) {
            view.focus();
        }
    }, 0);
}

let keyboardMenuAt = 0;
/** Where the last right-click menu opened. */
let lastMenuAt: { x: number; y: number } | undefined;

/** The right-click menu at a point (mouse), or under the cursor (keyboard: Menu key, Shift+F10). */
function showContextMenu(at: { x: number; y: number }, keyboard: boolean): void {
    const ctx = menuContext();
    if (!ctx || !view) {
        return;
    }
    if (keyboard) {
        keyboardMenuAt = Date.now();
    }
    lastMenuAt = at;
    showMenu(contextMenu(view.state, ctx), { at, focusFirst: keyboard, run: runMenuItem, onClose: refocusAfterMenu });
}

const contextMenuAtCursor: Command = (state, _dispatch, v) => {
    if (!v) {
        return false;
    }
    const coords = v.coordsAtPos(state.selection.head);
    showContextMenu({ x: coords.left, y: coords.bottom + 2 }, true);
    return true;
};

document.addEventListener('contextmenu', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('.dc-menu') || Date.now() - keyboardMenuAt < 600) {
        e.preventDefault(); // the keyboard already opened ours; no native menu over it
        return;
    }
    if (!view || !session || !content.contains(target)) {
        return;
    }
    e.preventDefault();
    // Right-click moves the cursor there, unless it is in the selection (to act on it). On a
    // map row's line, the row is selected (./mapView.ts).
    const hit = target.closest('.dc-maprow-head') ? null : view.posAtCoords({ left: e.clientX, top: e.clientY });
    if (hit) {
        const state = view.state;
        const atom = hit.inside >= 0 ? state.doc.nodeAt(hit.inside) : null;
        let selection: Selection | undefined;
        if (atom && atom.isAtom && !atom.isText && NodeSelection.isSelectable(atom)) {
            if (!(state.selection instanceof NodeSelection && state.selection.from === hit.inside)) {
                selection = NodeSelection.create(state.doc, hit.inside);
            }
        } else if (hit.pos < state.selection.from || hit.pos > state.selection.to) {
            selection = Selection.near(state.doc.resolve(hit.pos));
        }
        if (selection) {
            view.dispatch(state.tr.setSelection(selection));
        }
    }
    view.focus();
    showContextMenu({ x: e.clientX, y: e.clientY }, false);
});

// Paste from the menu: the clipboard's HTML (elements copied in the editor keep their structure)
// or text; where the webview may not read the clipboard, the host reads its text.
let clipboardRequest = 0;

async function pasteFromClipboard(): Promise<void> {
    if (!view || !editable()) {
        return;
    }
    try {
        const items = await navigator.clipboard.read();
        for (const type of ['text/html', 'text/plain']) {
            for (const item of items) {
                if (item.types.includes(type)) {
                    const data = await (await item.getType(type)).text();
                    view.focus();
                    if (type === 'text/html' ? view.pasteHTML(data) : view.pasteText(data)) {
                        return;
                    }
                }
            }
        }
        return;
    } catch {
        // Not allowed here: ask the host.
    }
    post({ type: 'clipboardRead', request: ++clipboardRequest });
}

function pasteText(message: Extract<HostToEditor, { type: 'clipboardText' }>): void {
    if (message.request !== clipboardRequest || !view || !editable()) {
        return;
    }
    if (message.text) {
        view.focus();
        view.pasteText(message.text);
    } else {
        status.title = t('pasteFailed');
    }
}

// ---------------------------------------------------------------------------------------------
// Reused content (spec §13.7): a selected reuse box offers Open source and Replace with copy.
// The host resolves the reference and builds the copy; the page puts it in place as one of its
// own changes (undo takes it back).

function xmlValue(node: PMNode, name: string): string | undefined {
    return (node.attrs.xml as [string, string][] | undefined)?.find(([n]) => n === name)?.[1];
}

/** A kept-as-written element that reuses content (`conref`, `conkeyref`; not a push). */
const isReuse = isReuseNode;

function reuseNodes(doc: PMNode): PMNode[] {
    const out: PMNode[] = [];
    doc.descendants((node) => {
        if (isReuse(node)) {
            out.push(node);
        }
        return !node.isAtom;
    });
    return out;
}

const reuseBar = Object.assign(document.createElement('div'), { className: 'dc-reuse-bar', hidden: true });
reuseBar.setAttribute('role', 'toolbar');
document.body.append(reuseBar);

let reuseRequest = 0;
/** Requests the host has not answered: the node each acts on. */
const reuseWaiting = new Map<number, { node: PMNode; action: ReuseAction }>();
/** An action waiting for the in-flight edit: the host must have the text the page shows. */
let reuseQueued: { node: PMNode; action: ReuseAction } | undefined;
/** What the bar says about the box it is for. */
let reuseNote: { node: PMNode; text: string } | undefined;

function selectedReuse(): { node: PMNode; pos: number } | undefined {
    const selection = view?.state.selection;
    return selection instanceof NodeSelection && isReuse(selection.node) ? { node: selection.node, pos: selection.from } : undefined;
}

function updateReuseBar(): void {
    const selected = selectedReuse();
    if (!selected || !view || !session) {
        reuseBar.hidden = true;
        return;
    }
    const { node } = selected;
    const reference = xmlValue(node, 'conkeyref') ?? xmlValue(node, 'conref') ?? '';
    const note = reuseNote?.node === node ? reuseNote.text : undefined;
    const open = button(t('openSource'), t('reuseOpen'), () => reuseAction(node, 'open'), 'reuse:open');
    const copy = button(t('replaceWithCopy'), t('replaceWithCopyTitle'), () => reuseAction(node, 'copy'), 'reuse:copy');
    open.disabled = paused !== undefined;
    copy.disabled = !editable();
    reuseBar.replaceChildren(
        Object.assign(document.createElement('span'), { className: 'dc-reuse-label', textContent: `${t('reused')} · ${reference}`, title: reference }),
        open,
        copy,
        ...(note ? [Object.assign(document.createElement('span'), { className: 'dc-reuse-note', textContent: note })] : []),
    );
    reuseBar.hidden = false;
    placeReuseBar(selected.pos);
}

function placeReuseBar(pos: number): void {
    const dom = view?.nodeDOM(pos);
    const rect = dom instanceof HTMLElement ? dom.getBoundingClientRect() : undefined;
    if (!rect) {
        reuseBar.hidden = true;
        return;
    }
    const height = reuseBar.offsetHeight;
    const below = rect.bottom + 4 + height <= window.innerHeight;
    reuseBar.style.left = `${Math.max(4, Math.min(rect.left, window.innerWidth - reuseBar.offsetWidth - 4))}px`;
    reuseBar.style.top = `${below ? rect.bottom + 4 : Math.max(4, rect.top - height - 4)}px`;
}

window.addEventListener('scroll', () => {
    const selected = reuseBar.hidden ? undefined : selectedReuse();
    if (selected) {
        placeReuseBar(selected.pos);
    }
}, { passive: true });

function noteReuse(node: PMNode, text: string): void {
    reuseNote = { node, text };
    updateReuseBar();
}

function reuseAction(node: PMNode, action: ReuseAction): void {
    if (!session || !view || paused !== undefined || (action === 'copy' && !editable())) {
        return;
    }
    flush(); // the host must have everything the page shows
    if (session.sync.busy) {
        reuseQueued = { node, action };
        return;
    }
    sendReuse(node, action);
}

function sendReuse(node: PMNode, action: ReuseAction): void {
    const offset = session ? reuseOffset(node) : undefined;
    if (offset === undefined) {
        noteReuse(node, t('reuseLost'));
        return;
    }
    const request = ++reuseRequest;
    reuseWaiting.set(request, { node, action });
    post({ type: 'reuse', action, request, version: session!.sync.documentVersion, offset });
}

/**
 * Where a reuse element starts in the text the host has (the page's document serializes to
 * it): the same reuse element in a fresh build of that text — by order, checked by attributes.
 */
function reuseOffset(node: PMNode): number | undefined {
    const built = freshBuild();
    if (!built) {
        return undefined;
    }
    const mine = reuseNodes(view!.state.doc);
    const theirs = reuseNodes(built.doc);
    const same = (a: PMNode, b: PMNode): boolean => a.type === b.type && JSON.stringify(a.attrs.xml) === JSON.stringify(b.attrs.xml);
    const k = mine.indexOf(node);
    let match = k !== -1 && mine.length === theirs.length && same(node, theirs[k]) ? theirs[k] : undefined;
    if (!match) {
        const candidates = theirs.filter((n) => same(node, n));
        match = candidates.length === 1 ? candidates[0] : undefined;
    }
    return match ? built.base.origin.get(match)?.start : undefined;
}

function reuseResult(message: Extract<HostToEditor, { type: 'reuseResult' }>): void {
    const waiting = reuseWaiting.get(message.request);
    reuseWaiting.delete(message.request);
    if (!waiting) {
        return;
    }
    if (message.error !== undefined) {
        noteReuse(waiting.node, message.error === 'stale' ? t('reuseStale') : format(t('reuseFailed'), message.error));
        return;
    }
    if (waiting.action === 'copy' && message.xml !== undefined) {
        replaceWithCopy(waiting.node, message.xml);
    }
}

/** Put the copy where the reuse element is. */
function replaceWithCopy(node: PMNode, xml: string): void {
    if (!session || !view || !editable()) {
        return;
    }
    let pos = -1;
    view.state.doc.descendants((n, p) => {
        if (pos === -1 && n === node) {
            pos = p;
        }
        return pos === -1 && !n.isAtom;
    });
    if (pos === -1) {
        noteReuse(node, t('reuseLost'));
        return;
    }
    const $pos = view.state.doc.resolve(pos);
    const parent = $pos.parent;
    const subset = internalSubsetEntities(doctypeInternalSubset(session.base.cst));
    const es = session.es;
    let nodes: PMNode[];
    try {
        nodes = buildFragment(xml, es, node.isInline ? 'inline' : 'block', {
            entity: (name) => subset.get(name) ?? es.grammar.entities[name],
            preserve: node.isInline && parent.type.spec.code === true,
        });
    } catch (error) {
        noteReuse(node, format(t('reuseFailed'), error instanceof Error ? error.message : String(error)));
        return;
    }
    if (node.isInline && node.marks.length > 0) {
        // Inside formatting, the copy is formatted the same way.
        nodes = nodes.map((n) => n.mark(node.marks.reduce((set, m) => m.addToSet(set), n.marks)));
    }
    const content = Fragment.from(nodes);
    if (nodes.length === 0 || !parent.canReplace($pos.index(), $pos.index() + 1, content)) {
        noteReuse(node, t('reuseNoFit'));
        return;
    }
    const tr = view.state.tr.replaceWith(pos, pos + node.nodeSize, content);
    tr.setSelection(Selection.near(tr.doc.resolve(pos), 1));
    view.dispatch(tr.scrollIntoView());
    view.focus();
}

document.addEventListener('keydown', (e) => {
    // A toolbar menu opened with the mouse does not have the keyboard focus.
    if (e.key === 'Escape' && openMenu()) {
        closeMenu();
        view?.focus();
    }
});

function scheduleUi(): void {
    if (uiScheduled) {
        return;
    }
    uiScheduled = true;
    requestAnimationFrame(() => {
        uiScheduled = false;
        updateUi();
    });
}

function updateUi(): void {
    if (!session || !view) {
        return;
    }
    const state = view.state;
    const can = editable();
    for (const b of toolbar.querySelectorAll<HTMLButtonElement>('button[data-id]')) {
        const id = b.dataset.id!;
        if (id === 'markup') {
            b.setAttribute('aria-pressed', String(showMarkup));
            continue;
        }
        if (id === 'expandAll' || id === 'collapseAll') {
            continue; // folding is not editing: a read-only map folds too
        }
        b.disabled = !can;
        if (id === 'indentRow' || id === 'outdentRow') {
            b.disabled = !can || !(id === 'indentRow' ? session.maps.indentRow : session.maps.outdentRow)(state);
        } else if (id === 'addReference') {
            b.disabled = !can || !session.maps.insertReference()(state);
        } else if (id === 'undo') {
            b.disabled = !can || undoDepth(state) === 0;
        } else if (id === 'redo') {
            b.disabled = !can || redoDepth(state) === 0;
        } else if (id.startsWith('mark:')) {
            const type = session.es.markType(id.slice(5));
            b.setAttribute('aria-pressed', String(type !== undefined && markActive(state, type)));
        }
    }
    const select = toolbar.querySelector<HTMLSelectElement>('select[data-id="style"]');
    if (select) {
        const current = currentElement(state);
        const options = can ? session.cmds.blockTypesAt(state) : [];
        select.replaceChildren(
            Object.assign(document.createElement('option'), { value: '', textContent: current ?? t('style'), selected: true }),
            ...options.map((name) => Object.assign(document.createElement('option'), { value: name, textContent: name })),
        );
        select.disabled = options.length === 0;
    }
    updateReuseBar();
    updateStatus();
}

function markActive(state: EditorState, type: MarkType): boolean {
    const { from, $from, to, empty } = state.selection;
    if (empty) {
        return type.isInSet(state.storedMarks ?? $from.marks()) !== undefined;
    }
    return state.doc.rangeHasMark(from, to, type);
}

function updateStatus(): void {
    if (!session || !view) {
        return;
    }
    const items: HTMLElement[] = [];
    const crumbs = document.createElement('nav');
    crumbs.className = 'dc-crumbs';
    const $from = view.state.selection.$from;
    const names: string[] = [];
    for (let d = 1; d <= $from.depth; d++) {
        const node = $from.node(d);
        const element = session.es.role(node.type)?.element;
        if (element) {
            names.push(element);
        }
    }
    if (view.state.selection instanceof NodeSelection) {
        const element = session.es.role(view.state.selection.node.type)?.element;
        if (element) {
            names.push(element);
        }
    }
    for (const mark of $from.marks()) {
        const element = session.es.markElement(mark.type);
        if (element) {
            names.push(element);
        }
    }
    names.forEach((name, i) => {
        if (i > 0) {
            crumbs.append(Object.assign(document.createElement('span'), { className: 'dc-crumb-sep', textContent: '›' }));
        }
        crumbs.append(Object.assign(document.createElement('span'), { className: 'dc-crumb', textContent: name }));
    });
    items.push(crumbs, Object.assign(document.createElement('span'), { className: 'dc-spacer' }));
    if (mapContextStatus) {
        const context = Object.assign(document.createElement('button'), {
            type: 'button', className: 'dc-status-item dc-context', textContent: `🗺 ${mapContextStatus.label}`, title: mapContextStatus.title,
        });
        context.addEventListener('mousedown', (e) => e.preventDefault());
        context.addEventListener('click', () => post({ type: 'command', command: 'mapContext' }));
        items.push(context);
    }
    // Problems: the one at the cursor, and the count (click: the next one).
    const shown = shownProblems(view.state);
    const here = problemHere(view.state);
    if (here) {
        const icon = { error: '✖', warning: '⚠', info: 'ℹ' }[here.mark.severity];
        const button = Object.assign(document.createElement('button'), {
            type: 'button',
            className: 'dc-status-item dc-problem-here',
            textContent: `${icon} ${here.mark.items[0].message}`,
            title: `${here.mark.items.map(problemText).join('\n')}\n\n💡 ${t('quickFixes')}`,
            disabled: !editable(),
        });
        button.addEventListener('mousedown', (e) => e.preventDefault());
        button.addEventListener('click', () => {
            // Above the status line, from the message.
            const rect = button.getBoundingClientRect();
            void showQuickFixes({ above: new DOMRect(rect.left, status.getBoundingClientRect().top, rect.width, rect.height) }, false);
        });
        items.push(button);
    }
    if (statusNote && Date.now() < statusNote.until) {
        items.push(Object.assign(document.createElement('span'), { className: 'dc-status-item dc-status-note', textContent: statusNote.text }));
    }
    const count = shown.reduce((n, p) => n + p.mark.items.length, 0);
    const problemButton = Object.assign(document.createElement('button'), {
        type: 'button',
        className: `dc-status-item dc-problems${count > 0 ? ' dc-has-problems' : ''}`,
        textContent: count === 0 ? t('noProblems') : count === 1 ? `⚠ ${t('oneProblem')}` : `⚠ ${format(t('problems'), count)}`,
        title: t('nextProblem'),
        disabled: count === 0,
    });
    problemButton.addEventListener('mousedown', (e) => e.preventDefault());
    problemButton.addEventListener('click', nextProblem);
    items.push(problemButton);
    const state = paused !== undefined ? '⚠' : session.readOnly ? t('readOnly') : session.sync.busy ? t('writing') : t('saved');
    items.push(Object.assign(document.createElement('span'), { className: 'dc-status-item', textContent: state }));
    items.push(Object.assign(document.createElement('span'), { className: 'dc-status-item', textContent: session.grammarLabel }));
    items.push(Object.assign(document.createElement('span'), { className: 'dc-status-item dc-file', textContent: session.fileName }));
    status.replaceChildren(...items);
}

function showBanner(): void {
    if (paused === undefined) {
        banner.hidden = true;
        banner.replaceChildren();
        return;
    }
    banner.hidden = false;
    banner.className = 'dc-banner dc-banner-parse';
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'dc-banner-link';
    open.textContent = paused;
    open.addEventListener('click', () => post({ type: 'openSource' }));
    banner.replaceChildren(open);
}

function applySettings(settings: EditorSettings): void {
    document.body.dataset.theme = settings.theme;
    document.body.classList.toggle('dc-fluid', settings.pageWidth === 0);
    if (settings.pageWidth > 0) {
        document.documentElement.style.setProperty('--dc-page-width', `${settings.pageWidth}px`);
    }
    showMarkup = settings.showMarkup;
    content.classList.toggle('dc-show-markup', showMarkup);
}

// ---------------------------------------------------------------------------------------------
// Host messages and keyboard

window.addEventListener('message', (event: MessageEvent<HostToEditor>) => {
    const message = event.data;
    switch (message.type) {
        case 'init':
            reuseQueued = undefined;
            start(message);
            break;
        case 'update':
            reuseQueued = undefined; // its node is gone with the rebuild
            if (session?.sync.external(message.version, message.text)) {
                rebuild(message.text);
            }
            updateStatus();
            break;
        case 'ack': {
            const next = session?.sync.ack(message.version);
            if (next) {
                post(next);
            }
            if (reuseQueued && session && !session.sync.busy) {
                const queued = reuseQueued;
                reuseQueued = undefined;
                sendReuse(queued.node, queued.action);
            }
            if (problemsWaiting && session && !session.sync.busy) {
                showProblems();
            }
            if (resolvedWaiting && session && !session.sync.busy) {
                showResolved();
            }
            if (fixQueued && session && !session.sync.busy) {
                const queued = fixQueued;
                fixQueued = undefined;
                void showQuickFixes(queued.at, queued.keyboard);
            }
            if (syncWaiting && session && !session.sync.busy) {
                pendingSync = syncWaiting;
                syncWaiting = undefined;
                reportSync();
            }
            updateStatus();
            break;
        }
        case 'reveal':
            reveal(message);
            break;
        case 'syncState':
            syncEnabled = message.enabled;
            break;
        case 'cursorRequest':
            post({ type: 'cursor', request: message.request, offset: paused === undefined ? cursorOffset() : undefined });
            break;
        case 'clipboardText':
            pasteText(message);
            break;
        case 'images':
        case 'text':
        case 'link':
        case 'quickFixes':
        case 'quickFixResult':
            hostReply(message);
            break;
        case 'resolved':
            resolved = { version: message.version, items: message.items };
            showResolved();
            break;
        case 'mapContext':
            mapContextStatus = message.label ? { label: message.label, title: message.title ?? '' } : undefined;
            updateStatus();
            break;
        case 'problems':
            problems = { version: message.version, items: message.items };
            showProblems();
            updateStatus();
            break;
        case 'reuseResult':
            reuseResult(message);
            break;
        case 'settings':
            applySettings(message.settings);
            renderToolbar();
            break;
        case 'debug':
            debug(message);
            break;
        case 'setAttributes':
            setAttributes(message);
            break;
    }
});

/** Integration-test hook: edit through real transactions (see messages.ts). */
function debug(message: Extract<HostToEditor, { type: 'debug' }>): void {
    if (!view || !editable()) {
        return;
    }
    if (message.action === 'undo') {
        undo(view.state, view.dispatch);
        return;
    }
    if (message.action === 'reuse') {
        const node = reuseNodes(view.state.doc)[message.index];
        if (node) {
            reuseAction(node, message.reuse);
        }
        return;
    }
    if (message.action === 'scroll') {
        window.scrollTo(0, message.y); // as the user scrolling
        return;
    }
    if (message.action === 'cell') {
        // As a click on the cell; then a key, or a right-click menu item.
        const pos = session ? cellAt(view, session.page, message.row, message.col) : undefined;
        if (pos === undefined) {
            post({ type: 'log', level: 'warn', message: `cell ${message.row},${message.col} not found` });
            return;
        }
        view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos)));
        if (message.key) {
            view.dom.dispatchEvent(new KeyboardEvent('keydown', { key: message.key, bubbles: true, cancelable: true }));
        }
        if (message.id) {
            const ctx = menuContext();
            const item = ctx ? findItem(contextMenu(view.state, ctx), message.id) : undefined;
            if (item?.enabled) {
                runMenuItem(item);
            } else {
                post({ type: 'log', level: 'warn', message: `menu item ${message.id} ${item ? 'disabled' : 'not found'}` });
            }
        }
        return;
    }
    if (message.action === 'row') {
        // As a click on the row's line; then its arrow (fold), or a right-click menu item.
        const pos = rowByLabel(view, message.label);
        if (pos === undefined) {
            post({ type: 'log', level: 'warn', message: `row "${message.label}" not found` });
            return;
        }
        view.dispatch(view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos)));
        if (message.fold !== undefined) {
            setFold(view, pos, message.fold);
        }
        if (message.key) {
            // As pressed on the page; F2 with `text`: typed in the field, then Enter.
            const [mod, key] = message.key.startsWith('Mod-') ? [true, message.key.slice(4)] : [false, message.key];
            const shift = key.startsWith('Shift-');
            view.dom.dispatchEvent(new KeyboardEvent('keydown', { key: shift ? key.slice(6) : key, shiftKey: shift, ctrlKey: mod, bubbles: true, cancelable: true }));
            const input = view.dom.querySelector<HTMLInputElement>('.dc-maprow-input');
            if (input && message.text !== undefined) {
                input.value = message.text;
                input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
            }
        }
        if (message.drop) {
            const target = message.drop.cell ? cellAt(view, session!.page, message.drop.cell[0], message.drop.cell[1]) : rowByLabel(view, message.drop.label ?? '');
            if (target === undefined || !dropRow(view, session!.page, pos, target, [message.drop.place])) {
                post({ type: 'log', level: 'warn', message: `row "${message.label}" not dropped ${message.drop.place} ${JSON.stringify(message.drop)}` });
            }
        }
        if (message.id) {
            const ctx = menuContext();
            const item = ctx ? findItem(contextMenu(view.state, ctx), message.id) : undefined;
            if (item?.enabled) {
                runMenuItem(item);
            } else {
                post({ type: 'log', level: 'warn', message: `menu item ${message.id} ${item ? 'disabled' : 'not found'}` });
            }
        }
        return;
    }
    if (message.action === 'pasteImage') {
        let found = -1;
        view.state.doc.descendants((node, pos) => {
            if (found === -1 && node.isText && node.text!.includes(message.search)) {
                found = pos + node.text!.indexOf(message.search) + message.search.length;
            }
            return found === -1;
        });
        if (found !== -1) {
            view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, found)));
            void insertImageData([{ data: message.data, mime: message.mime }]);
        }
        return;
    }
    if (message.action === 'quickFix') {
        // As Ctrl+. there, then a click on the fix.
        let found = -1;
        view.state.doc.descendants((node, pos) => {
            if (found === -1 && node.isText && node.text!.includes(message.search)) {
                found = pos + node.text!.indexOf(message.search) + message.search.length;
            }
            return found === -1;
        });
        if (found === -1) {
            return;
        }
        view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, found)));
        void listQuickFixes().then((listed) => {
            const fix = listed?.reply.fixes?.find((f) => f.title.includes(message.title));
            if (fix) {
                void makeQuickFix(fix.id, fix.title);
            } else {
                post({ type: 'log', level: 'warn', message: `quick fix "${message.title}" not offered: ${JSON.stringify(listed?.reply)}` });
            }
        });
        return;
    }
    if (message.action === 'menu') {
        // As a right-click there: the cursor moves, the menu is built for it, the item runs.
        let found = -1;
        view.state.doc.descendants((node, pos) => {
            if (found === -1 && node.isText && node.text!.includes(message.search)) {
                found = pos + node.text!.indexOf(message.search);
            }
            return found === -1;
        });
        if (found === -1) {
            return;
        }
        const end = found + message.search.length;
        view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, message.select ? found : end, end)));
        const ctx = menuContext();
        const item = ctx ? findItem(contextMenu(view.state, ctx), message.id) : undefined;
        if (item?.enabled) {
            runMenuItem(item);
        } else {
            post({ type: 'log', level: 'warn', message: `menu item ${message.id} ${item ? 'disabled' : 'not found'}` });
        }
        return;
    }
    let at = -1;
    view.state.doc.descendants((node, pos) => {
        if (at === -1 && node.isText && node.text!.includes(message.search)) {
            at = pos + node.text!.indexOf(message.search) + message.search.length;
        }
        return at === -1;
    });
    if (at !== -1) {
        // As typing does: the cursor ends after the inserted text.
        const tr = view.state.tr.insertText(message.text, at);
        view.dispatch(tr.setSelection(TextSelection.create(tr.doc, at + message.text.length)));
    }
}

// A key the editor handled (ProseMirror prevented its default) is not a VS Code shortcut too.
document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented) {
        e.stopPropagation();
    }
});

window.addEventListener('error', (e) => post({ type: 'log', level: 'error', message: String(e.message) }));

// Tell the host the page is listening; it answers with `init`.
post({ type: 'ready' });
