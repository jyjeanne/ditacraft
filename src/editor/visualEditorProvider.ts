/**
 * Visual editor (spec §13): a custom text editor (`ditacraft.visualEditor`, priority
 * "option") that edits a DITA topic on a word-processor-like page.
 *
 * The page (webview/editor/main.ts) holds the ProseMirror document, built from the source
 * text it receives, and sends back one minimal span edit per change, stamped with the
 * document version it was computed against. This host is the only writer: it applies the
 * edit as a WorkspaceEdit, so undo in the text editor, the dirty state, saving, Git and the
 * LSP all see ordinary text edits. Its own edits are acknowledged; any other change to the
 * document (the text editor, an external tool, a refused edit) is sent to the page, which
 * rebuilds from it.
 *
 * Quick fixes (spec §11.1) come from the code action providers (the language server's, DitaCraft
 * AI's) for the diagnostics the page shows at its cursor. A fix that only edits this topic goes
 * to the page as text edits: the page makes it as its own change, so its undo takes it back.
 * Any other fix (a command, other files) is applied here, like a change in the text editor.
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getGlobalKeySpaceResolver } from '../providers/ditaLinkProvider';
import { parse } from '../shared/cst/parse';
import { doctypeInternalSubset, doctypePublicId, rootElement, walk } from '../shared/cst/query';
import { isElement, type Document, type ElementNode } from '../shared/cst/types';
import { IMAGE_EXTENSIONS, isImagePath } from '../shared/editor/images';
import type { LinkTarget } from '../shared/editor/links';
import type { ProblemItem } from '../shared/editor/problems';
import type { TextEdit } from '../shared/editor/sourceChange';
import { internalSubsetEntities } from '../shared/render/html';
import { format, labelsFor } from '../shared/render/labels';
import type { EditMessage } from '../shared/editor/sync';
import type { Grammar } from '../shared/grammar/types';
import { grammarSelectOptions } from '../preview/grammarOptions';
import { buildPageHtml } from '../preview/pageHtml';
import { isInside, realPathSync, samePath } from '../preview/paths';
import { parseReference, ReferenceResolver, resolvePath, type KeyDefinitionLike } from '../preview/resolver';
import { sharedGrammarRegistry } from '../preview/sharedRegistry';
import { readWorkspaceText } from '../preview/workspaceText';
import { configManager } from '../utils/configurationManager';
import { logger } from '../utils/logger';
import type { EditorSettings, EditorToHost, HostToEditor, SelectedElement } from './messages';
import { extensionForMime, hrefFor, pastedImageFolder, pastedImageName } from './imageFiles';
import { openLinkTarget, pickLinkTarget, type DialogAnswer, type LinkPickerContext } from './linkPicker';
import { reuseCopy } from './reuseCopy';
import { mapRowItems, resolvedItems } from './reusedContent';
import { placeLabel } from '../preview/mapContext';
import { MapContexts, type TopicContext } from '../preview/mapContexts';

export interface EditorDebugState {
    uri: string;
    ready: boolean;
    version: number;
    grammarId?: string;
    sent: Record<string, number>;
    applied: number;
    refused: number;
    /** Diagnostics the page shows marks for. */
    problemMarks: number;
    /** Elements around the page's cursor, innermost first. */
    selectionPath: string[];
    /** What the page shows for each resolved reference (reused content's text, a key's text, a link title, an image). */
    resolvedShown: string[];
    /** The map context the status line shows (spec §13.8 M4). */
    mapContext?: string;
    /** The titles of the quick fixes last listed for the page. */
    quickFixes: string[];
}

/** What the Properties pane needs from a visual editor. */
export interface VisualEditorSelectionSource {
    readonly document: vscode.TextDocument;
    readonly grammar: Grammar | undefined;
    /** The elements around the page's cursor, innermost first, valid for `stamp`. */
    readonly selection: { stamp: number; chain: SelectedElement[] } | undefined;
    readonly readOnly: boolean;
    setAttributes(stamp: number, pos: number, name: string, before: [string, string][], xml: [string, string][]): void;
}

export class VisualEditorProvider implements vscode.CustomTextEditorProvider {
    public static readonly viewType = 'ditacraft.visualEditor';
    private static readonly sessions = new Set<EditorSession>();
    private static activeSession: EditorSession | undefined;
    private static readonly selectionEmitter = new vscode.EventEmitter<VisualEditorSelectionSource | undefined>();
    /** The active visual editor changed, or its selection did (undefined: none is active). */
    public static readonly onDidChangeSelection = VisualEditorProvider.selectionEmitter.event;

    private constructor(private readonly context: vscode.ExtensionContext) {}

    /** The visual editor that has focus, if any. */
    public static get active(): VisualEditorSelectionSource | undefined {
        return VisualEditorProvider.activeSession;
    }

    /** Called by sessions. */
    static sessionChanged(session: EditorSession, active: boolean | undefined): void {
        if (active === true) {
            VisualEditorProvider.activeSession = session;
        } else if (active === false && VisualEditorProvider.activeSession === session) {
            VisualEditorProvider.activeSession = undefined;
        }
        if (VisualEditorProvider.activeSession === session || active === false) {
            VisualEditorProvider.selectionEmitter.fire(VisualEditorProvider.activeSession);
        }
    }

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        return vscode.window.registerCustomEditorProvider(VisualEditorProvider.viewType, new VisualEditorProvider(context), {
            // The page holds the editing state (undo history, selection): keep it when hidden.
            webviewOptions: { retainContextWhenHidden: true, enableFindWidget: true },
            supportsMultipleEditorsPerDocument: false,
        });
    }

    public resolveCustomTextEditor(document: vscode.TextDocument, panel: vscode.WebviewPanel): void {
        const session = new EditorSession(this.context, document, panel);
        VisualEditorProvider.sessions.add(session);
        if (panel.active) {
            VisualEditorProvider.sessionChanged(session, true);
        }
        panel.onDidChangeViewState(() => VisualEditorProvider.sessionChanged(session, panel.active));
        panel.onDidDispose(() => {
            VisualEditorProvider.sessions.delete(session);
            VisualEditorProvider.sessionChanged(session, false);
            session.dispose();
        });
    }

    /** State of the open visual editors (integration tests, diagnostics). */
    public static debugState(): EditorDebugState[] {
        return [...VisualEditorProvider.sessions].map((s) => s.debugState());
    }

    /** Feed a page message to the editor of `uri`, as if the page sent it (integration tests). */
    public static async debugMessage(uri: string, message: EditorToHost): Promise<void> {
        const session = [...VisualEditorProvider.sessions].find((s) => s.uri === uri);
        await session?.handle(message);
    }

    /** Send a message to the page of `uri` (integration tests: `debug` actions). */
    public static debugPost(uri: string, message: HostToEditor): void {
        [...VisualEditorProvider.sessions].find((s) => s.uri === uri)?.postToPage(message);
    }

    /** Answers given instead of the next dialogs (integration tests: pickers cannot be clicked). */
    static readonly dialogAnswers: DialogAnswer[] = [];

    public static queueDialogAnswer(answer: DialogAnswer): void {
        VisualEditorProvider.dialogAnswers.push(answer);
    }

    /** Where the next visual editor of a document opens its cursor (Open in Visual Editor from the text). */
    private static readonly handoffs = new Map<string, number>();

    public static handoff(uri: vscode.Uri, offset: number): void {
        const open = [...VisualEditorProvider.sessions].find((s) => s.uri === uri.toString());
        if (!open?.revealCursor(offset)) {
            VisualEditorProvider.handoffs.set(uri.toString(), offset); // taken when its page is ready
        }
    }

    static takeHandoff(uri: string): number | undefined {
        const offset = VisualEditorProvider.handoffs.get(uri);
        VisualEditorProvider.handoffs.delete(uri);
        return offset;
    }

    /** The source offset of the cursor in the visual editor of `uri`, if one is open (Open Source handoff). */
    public static cursorOffset(uri: vscode.Uri): Promise<number | undefined> {
        const session = [...VisualEditorProvider.sessions].find((s) => s.uri === uri.toString());
        return session ? session.cursorOffset() : Promise.resolve(undefined);
    }
}

class EditorSession implements vscode.Disposable, VisualEditorSelectionSource {
    grammar: Grammar | undefined;
    selection: { stamp: number; chain: SelectedElement[] } | undefined;
    readOnly = false;
    private ready = false;
    /** Changes of the document this session made and has not yet seen come back. */
    private pendingSelfEdits = 0;
    private queue: Promise<void> = Promise.resolve();
    private grammarKey = '';
    private grammarId: string | undefined;
    private readonly sent: Record<string, number> = {};
    private applied = 0;
    private refused = 0;
    /** Diagnostics the page shows marks for, as it last reported. */
    private problemMarks = 0;
    /** Text-editor events are this session's own reveals until then (no echo back to the page). */
    private suppressEditorEventsUntil = 0;
    private lastEditorCursorAt = 0;
    private lastPageEditAt = 0;
    private syncEnabled: boolean | undefined;
    private cursorRequests = new Map<number, (offset: number | undefined) => void>();
    private cursorRequest = 0;
    private readonly disposables: vscode.Disposable[] = [];

    constructor(
        private readonly context: vscode.ExtensionContext,
        readonly document: vscode.TextDocument,
        private readonly panel: vscode.WebviewPanel,
    ) {
        const webview = panel.webview;
        webview.options = { enableScripts: true, localResourceRoots: this.resourceRoots() };
        webview.html = this.html();
        this.disposables.push(
            webview.onDidReceiveMessage((m: EditorToHost) => {
                void this.handle(m);
            }),
            vscode.workspace.onDidChangeTextDocument((e) => this.onDocumentChange(e)),
            // Resolved references follow the topic and the files they read (open, saved, changed on disk).
            vscode.workspace.onDidChangeTextDocument((e) => {
                if (e.contentChanges.length > 0 && (e.document === this.document || this.readsFile(e.document.uri))) {
                    this.scheduleResolved();
                }
            }),
            vscode.workspace.onDidSaveTextDocument((d) => {
                if (this.readsFile(d.uri)) {
                    this.scheduleResolved();
                }
            }),
            ...(MapContexts.get() ? [MapContexts.get()!.onDidChange((topic) => {
                if (!topic || samePath(topic, this.document.uri.fsPath)) {
                    this.refreshContext();
                }
            })] : []),
            vscode.languages.onDidChangeDiagnostics((e) => {
                if (e.uris.some((u) => u.toString() === this.uri)) {
                    this.postProblems();
                }
            }),
            vscode.workspace.onDidChangeConfiguration((e) => {
                if (e.affectsConfiguration('ditacraft.previewTheme') || e.affectsConfiguration('ditacraft.previewPageWidth')
                    || e.affectsConfiguration('ditacraft.previewShowMarkup')) {
                    this.post({ type: 'settings', settings: this.settings() });
                }
                if (e.affectsConfiguration('ditacraft.previewScrollSync')) {
                    this.postSyncState();
                }
            }),
            // Sync with a text editor showing the same document (spec §11.2).
            vscode.window.onDidChangeVisibleTextEditors(() => this.postSyncState()),
            panel.onDidChangeViewState(() => this.postSyncState()),
            vscode.window.onDidChangeTextEditorSelection((e) => {
                // Keyboard, mouse, commands (Go to…, the Problems panel); not a cursor moved by an edit.
                if (e.kind !== undefined && this.followsEditor(e.textEditor)) {
                    this.lastEditorCursorAt = Date.now();
                    this.post({ type: 'reveal', version: this.document.version, offset: this.document.offsetAt(e.selections[0].active), mode: 'cursor' });
                }
            }),
            vscode.window.onDidChangeTextEditorVisibleRanges((e) => {
                // Scrolling that comes with a cursor move (typing, clicking) is the cursor's.
                if (this.followsEditor(e.textEditor) && e.visibleRanges.length > 0 && Date.now() - this.lastEditorCursorAt > 300) {
                    this.post({ type: 'reveal', version: this.document.version, offset: this.document.offsetAt(e.visibleRanges[0].start), mode: 'scroll' });
                }
            }),
        );
        const watcher = vscode.workspace.createFileSystemWatcher('**/*.{dita,ditamap,bookmap,xml}');
        const onDisk = (uri: vscode.Uri): void => {
            // A map can change the keys that conkeyref goes through.
            if (this.readsFile(uri) || /\.(ditamap|bookmap)$/i.test(uri.fsPath)) {
                this.scheduleResolved();
            }
        };
        this.disposables.push(watcher, watcher.onDidChange(onDisk), watcher.onDidCreate(onDisk), watcher.onDidDelete(onDisk));
    }

    // -- reused content --------------------------------------------------------------------------------

    private reusedTimer: ReturnType<typeof setTimeout> | undefined;
    /** Files read to resolve the references last time. */
    private resolvedDependencies = new Set<string>();
    /** What the page reports it shows (diagnostics, tests). */
    private resolvedShown: string[] = [];

    private readsFile(uri: vscode.Uri): boolean {
        return uri.scheme === 'file' && [...this.resolvedDependencies].some((d) => samePath(d, uri.fsPath));
    }

    private scheduleResolved(delay = 500): void {
        if (this.reusedTimer) {
            clearTimeout(this.reusedTimer);
        }
        this.reusedTimer = setTimeout(() => {
            this.reusedTimer = undefined;
            this.postResolved().catch((error) => logger.error('Visual editor: resolving references failed', error));
        }, delay);
    }

    /** A webview URL for a local file the page may load (its resource roots), else undefined. */
    private webviewUri(absolutePath: string): string | undefined {
        const allowed = this.resourceRoots().some((root) => root.scheme === 'file' && isInside(realPathSync(absolutePath), realPathSync(root.fsPath)));
        return allowed ? this.panel.webview.asWebviewUri(vscode.Uri.file(absolutePath)).toString() : undefined;
    }

    /**
     * Resolve the topic's references as the preview does, and send the page what each element
     * kept whole shows — in a map, also what each row's target is called (spec §13.8).
     */
    private async postResolved(): Promise<void> {
        if (!this.ready || !this.grammar) {
            return;
        }
        const version = this.document.version;
        let doc: Document;
        try {
            doc = parse(this.document.getText());
        } catch {
            return; // not well-formed now: the page keeps what it shows
        }
        const grammar = this.grammar;
        const subset = internalSubsetEntities(doctypeInternalSubset(doc));
        const entity = (name: string): string | undefined => subset.get(name) ?? grammar.entities[name];
        const classOf = (name: string): string | undefined => grammar.elements[name]?.class;
        const resolver = new ReferenceResolver({
            files: { readText: (p) => readWorkspaceText(p, this.document.uri) },
            keys: { resolveKey: (key, file) => this.resolveKey(key, file) },
            classOf,
            entity,
        });
        const docPath = this.document.uri.fsPath;
        const outcome = await resolver.resolve(doc, docPath);
        const root = rootElement(doc);
        const rows = root && resolver.tokens(root).includes('map/map') ? await mapRowItems(doc, resolver, docPath, outcome.dependencies) : [];
        if (this.document.version !== version) {
            return; // the topic changed meanwhile: a newer pass is scheduled
        }
        this.resolvedDependencies = outcome.dependencies;
        const items = resolvedItems(doc, resolver, outcome.resolutions, {
            classOf,
            entity,
            labels: labelsFor(vscode.env.language),
            imageSrc: (href, _el, sourcePath) => {
                if (/^data:image\//i.test(href)) {
                    return href;
                }
                if (/^[a-z][\w+.-]+:/i.test(href) && !/^file:/i.test(href)) {
                    return undefined; // remote images: blocked by the page's policy
                }
                const clean = href.replace(/[?#].*$/, '');
                return this.webviewUri(path.isAbsolute(clean) ? clean : resolvePath(sourcePath ?? docPath, clean));
            },
        }, (file) => this.webviewUri(file));
        this.post({ type: 'resolved', version, items: [...items, ...rows] });
    }

    // -- sync with the text editor ----------------------------------------------------------------

    private syncOn(): boolean {
        return configManager.get('previewScrollSync');
    }

    /** Text editors showing this document. */
    private textEditors(): vscode.TextEditor[] {
        return vscode.window.visibleTextEditors.filter((e) => e.document.uri.toString() === this.uri);
    }

    /** Whether the page should follow an event of `editor` (not an echo of the page's own sync or edits). */
    private followsEditor(editor: vscode.TextEditor): boolean {
        return this.ready && this.syncOn() && this.panel.visible && editor.document.uri.toString() === this.uri
            && Date.now() >= this.suppressEditorEventsUntil && Date.now() - this.lastPageEditAt > 300;
    }

    private postSyncState(): void {
        const enabled = this.syncOn() && this.panel.visible && this.textEditors().length > 0;
        if (enabled !== this.syncEnabled) {
            this.syncEnabled = enabled;
            this.post({ type: 'syncState', enabled });
        }
    }

    /** The page's cursor moved, or the page scrolled: the text editors follow. */
    private followPage(message: Extract<EditorToHost, { type: 'sync' }>): void {
        if (!this.syncOn() || message.version !== this.document.version) {
            return; // computed against another text
        }
        const position = this.document.positionAt(message.offset);
        const range = new vscode.Range(position, position);
        this.suppressEditorEventsUntil = Date.now() + 350;
        for (const editor of this.textEditors()) {
            if (message.mode === 'cursor') {
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
            } else {
                editor.revealRange(range, vscode.TextEditorRevealType.AtTop);
            }
        }
    }

    /** Put the page's cursor at `offset` and focus it (Open in Visual Editor); false before the page is ready. */
    revealCursor(offset: number): boolean {
        if (!this.ready) {
            return false;
        }
        this.post({ type: 'reveal', version: this.document.version, offset, mode: 'cursor', focus: true });
        return true;
    }

    /** The source offset of the page's cursor (Open Source handoff); undefined after a second without answer. */
    cursorOffset(): Promise<number | undefined> {
        if (!this.ready) {
            return Promise.resolve(undefined);
        }
        const request = ++this.cursorRequest;
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                this.cursorRequests.delete(request);
                resolve(undefined);
            }, 1000);
            this.cursorRequests.set(request, (offset) => {
                clearTimeout(timer);
                resolve(offset);
            });
            this.post({ type: 'cursorRequest', request });
        });
    }

    get uri(): string {
        return this.document.uri.toString();
    }

    dispose(): void {
        if (this.reusedTimer) {
            clearTimeout(this.reusedTimer);
        }
        for (const d of this.disposables.splice(0)) {
            d.dispose();
        }
    }

    debugState(): EditorDebugState {
        return {
            uri: this.uri, ready: this.ready, version: this.document.version, grammarId: this.grammarId,
            sent: { ...this.sent }, applied: this.applied, refused: this.refused, problemMarks: this.problemMarks,
            selectionPath: this.selection?.chain.map((e) => e.name) ?? [],
            resolvedShown: this.resolvedShown,
            mapContext: this.contextShown,
            quickFixes: this.fixes?.actions.map(fixTitle) ?? [],
        };
    }

    // -- page ----------------------------------------------------------------------------------

    /** The extension, the topic's own workspace folder and its folder (images); as the preview in Restricted Mode. */
    private resourceRoots(): vscode.Uri[] {
        const roots = [this.context.extensionUri];
        const folder = vscode.workspace.getWorkspaceFolder(this.document.uri);
        if (folder) {
            roots.push(folder.uri);
        }
        if (this.document.uri.scheme === 'file') {
            roots.push(vscode.Uri.file(path.dirname(this.document.uri.fsPath)));
        }
        return roots;
    }

    private html(): string {
        const webview = this.panel.webview;
        const version = String((this.context.extension.packageJSON as { version?: string }).version ?? '0');
        const asset = (file: string) => webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview', file)).toString() + `?v=${version}`;
        const css = this.customCssPath();
        const baseHref = this.document.uri.scheme === 'file'
            ? `${webview.asWebviewUri(vscode.Uri.file(path.dirname(this.document.uri.fsPath))).toString()}/`
            : undefined;
        return buildPageHtml({
            cspSource: webview.cspSource,
            nonce: crypto.randomBytes(16).toString('base64'),
            scriptUri: asset('editor.js'),
            styleUri: asset('editor.css'),
            customCssUri: css ? webview.asWebviewUri(vscode.Uri.file(css)).toString() : undefined,
            lang: vscode.env.language,
            title: 'DITA Visual Editor',
            toolbarLabel: 'Visual editor',
            baseHref,
        });
    }

    private customCssPath(): string | undefined {
        const setting = configManager.get('previewCustomCss');
        if (!setting || !vscode.workspace.isTrusted) {
            return undefined;
        }
        const folder = vscode.workspace.getWorkspaceFolder(this.document.uri) ?? vscode.workspace.workspaceFolders?.[0];
        const resolved = folder ? setting.replace(/\$\{workspaceFolder\}/g, folder.uri.fsPath) : setting;
        const absolute = path.isAbsolute(resolved) ? resolved : folder ? path.join(folder.uri.fsPath, resolved) : resolved;
        return fs.existsSync(absolute) ? absolute : undefined;
    }

    private settings(): EditorSettings {
        return {
            pageWidth: configManager.get('previewPageWidth'),
            theme: configManager.get('previewTheme'),
            showMarkup: configManager.get('previewShowMarkup'),
        };
    }

    private post(message: HostToEditor): void {
        if (!this.ready) {
            return; // the page asks for the state when it is ready
        }
        this.sent[message.type] = (this.sent[message.type] ?? 0) + 1;
        void this.panel.webview.postMessage(message);
    }

    postToPage(message: HostToEditor): void {
        this.post(message);
    }

    // -- grammar -------------------------------------------------------------------------------------

    /** What decides the grammar: the DOCTYPE PUBLIC id and the root element. */
    private grammarKeyOf(text: string): string | undefined {
        try {
            const doc = parse(text);
            return `${doctypePublicId(doc) ?? ''}|${rootElement(doc)?.name ?? ''}`;
        } catch {
            return undefined; // not well-formed: keep the current grammar
        }
    }

    private sendInit(): void {
        const text = this.document.getText();
        let doc;
        try {
            doc = parse(text);
        } catch {
            doc = parse('<dita/>'); // not well-formed yet: the composite grammar, the page waits
        }
        const selected = sharedGrammarRegistry(this.context).select(doc, grammarSelectOptions(this.document));
        this.grammarKey = this.grammarKeyOf(text) ?? this.grammarKey;
        this.grammarId = selected.id;
        this.grammar = selected.grammar;
        this.readOnly = vscode.workspace.fs.isWritableFileSystem(this.document.uri.scheme) === false;
        if (!selected.grammar) {
            void vscode.window.showErrorMessage('DITA Craft: no grammar is available for the visual editor.');
            return;
        }
        this.post({
            type: 'init',
            version: this.document.version,
            text,
            grammar: selected.grammar,
            grammarLabel: selected.fallback ? `${selected.label} — fallback` : selected.label,
            fallback: selected.fallback,
            fileName: path.basename(this.document.uri.fsPath),
            locale: vscode.env.language,
            settings: this.settings(),
            readOnly: this.readOnly,
        });
    }

    /** The document's diagnostics, for problem marks on the page (spec §11.1). */
    private postProblems(): void {
        const severity = (s: vscode.DiagnosticSeverity): ProblemItem['severity'] | undefined =>
            s === vscode.DiagnosticSeverity.Error ? 'error'
                : s === vscode.DiagnosticSeverity.Warning ? 'warning'
                    : s === vscode.DiagnosticSeverity.Information ? 'info' : undefined;
        const items: ProblemItem[] = [];
        const diagnostics: vscode.Diagnostic[] = [];
        for (const d of vscode.languages.getDiagnostics(this.document.uri)) {
            const level = severity(d.severity);
            if (level) {
                diagnostics.push(d);
                items.push({
                    start: this.document.offsetAt(d.range.start),
                    end: this.document.offsetAt(d.range.end),
                    line: d.range.start.line + 1,
                    severity: level,
                    message: d.message,
                    code: typeof d.code === 'object' ? String(d.code.value) : d.code !== undefined ? String(d.code) : undefined,
                    source: d.source,
                });
            }
        }
        this.postedProblems = { version: this.document.version, diagnostics };
        this.post({ type: 'problems', version: this.document.version, items });
    }

    // -- quick fixes ---------------------------------------------------------------------------------

    /** The diagnostics last sent to the page, in the order of its items. */
    private postedProblems: { version: number; diagnostics: vscode.Diagnostic[] } | undefined;
    /** The fixes last listed for the page, for the document version they were computed on. */
    private fixes: { version: number; actions: (vscode.CodeAction | vscode.Command)[] } | undefined;

    /** The quick fixes for problems the page shows (as the light bulb lists them in the text editor), preferred ones first. */
    private async quickFixes(message: Extract<EditorToHost, { type: 'quickFixes' }>): Promise<void> {
        const reply = (result: { fixes?: { id: number; title: string; preferred?: boolean }[]; error?: string }): void =>
            this.post({ type: 'quickFixes', request: message.request, ...result });
        const posted = this.postedProblems;
        if (!posted || posted.version !== message.version) {
            reply({ error: 'stale' }); // newer problems are on their way to the page
            return;
        }
        const version = this.document.version;
        const found: (vscode.CodeAction | vscode.Command)[] = [];
        const titles = new Set<string>();
        for (const diagnostic of message.problems.map((i) => posted.diagnostics[i]).filter((d) => d !== undefined)) {
            let actions: (vscode.CodeAction | vscode.Command)[] | undefined;
            try {
                actions = await vscode.commands.executeCommand<(vscode.CodeAction | vscode.Command)[]>(
                    'vscode.executeCodeActionProvider', this.document.uri, diagnostic.range, vscode.CodeActionKind.QuickFix.value);
            } catch (error) {
                logger.error('Visual editor: quick fixes failed', error);
            }
            for (const action of actions ?? []) {
                const fix = isCommand(action) || (!action.disabled && (!action.kind || vscode.CodeActionKind.QuickFix.contains(action.kind)));
                if (fix && !titles.has(fixTitle(action))) {
                    titles.add(fixTitle(action));
                    found.push(action);
                }
            }
        }
        const preferred = (a: vscode.CodeAction | vscode.Command): boolean => !isCommand(a) && a.isPreferred === true;
        const actions = found.map((a, k) => ({ a, k })).sort((x, y) => Number(preferred(y.a)) - Number(preferred(x.a)) || x.k - y.k).map((x) => x.a);
        this.fixes = { version, actions };
        reply({ fixes: actions.map((a, id) => ({ id, title: fixTitle(a), ...(preferred(a) ? { preferred: true } : {}) })) });
    }

    /** Make a fix: its edits for the page to make, or applied here (a command, other files, or asked to). */
    private async quickFix(message: Extract<EditorToHost, { type: 'quickFix' }>): Promise<void> {
        const reply = (result: { edits?: TextEdit[]; applied?: boolean; error?: string }): void =>
            this.post({ type: 'quickFixResult', request: message.request, ...result });
        const action = this.fixes?.actions[message.id];
        if (!action || this.fixes?.version !== this.document.version || message.version !== this.document.version) {
            reply({ error: 'stale' });
            return;
        }
        const edits = message.direct ? undefined : this.topicEdits(action);
        if (edits) {
            reply({ edits });
            return;
        }
        try {
            if (isCommand(action)) {
                await vscode.commands.executeCommand(action.command, ...(action.arguments ?? []));
            } else {
                if (action.edit && !(await vscode.workspace.applyEdit(action.edit))) {
                    reply({ error: 'not applied' });
                    return;
                }
                if (action.command) {
                    await vscode.commands.executeCommand(action.command.command, ...(action.command.arguments ?? []));
                }
            }
            this.fixes = undefined;
            reply({ applied: true });
        } catch (error) {
            logger.error('Visual editor: quick fix failed', error);
            reply({ error: error instanceof Error ? error.message : String(error) });
        }
    }

    /** The edits of a fix that only edits this topic (no command), as offsets of its text; else undefined. */
    private topicEdits(action: vscode.CodeAction | vscode.Command): TextEdit[] | undefined {
        if (isCommand(action) || action.command || !action.edit) {
            return undefined;
        }
        const entries = action.edit.entries();
        if (entries.length === 0 || entries.some(([uri]) => uri.toString() !== this.uri)) {
            return undefined;
        }
        return entries.flatMap(([, edits]) => edits.map((e) => ({
            start: this.document.offsetAt(e.range.start), end: this.document.offsetAt(e.range.end), text: e.newText,
        })));
    }

    setAttributes(stamp: number, pos: number, name: string, before: [string, string][], xml: [string, string][]): void {
        this.post({ type: 'setAttributes', stamp, pos, name, before, xml });
    }

    // -- messages ------------------------------------------------------------------------------------

    async handle(message: EditorToHost): Promise<void> {
        switch (message.type) {
            case 'ready': {
                this.ready = true;
                this.sendInit();
                this.postProblems();
                this.scheduleResolved(0);
                this.refreshContext(true);
                this.syncEnabled = undefined;
                this.postSyncState();
                // Opened from the text editor: start where its cursor was.
                const handoff = VisualEditorProvider.takeHandoff(this.uri);
                if (handoff !== undefined) {
                    this.post({ type: 'reveal', version: this.document.version, offset: handoff, mode: 'cursor', focus: true });
                }
                return;
            }
            case 'sync':
                this.followPage(message);
                return;
            case 'cursor':
                this.cursorRequests.get(message.request)?.(message.offset);
                this.cursorRequests.delete(message.request);
                return;
            case 'pickImage':
            case 'imageFiles':
            case 'saveImage':
                await this.images(message);
                return;
            case 'askText': {
                const value = await this.askText(message.prompt, message.value, message.placeHolder);
                this.post({ type: 'text', request: message.request, value });
                return;
            }
            case 'pickLink': {
                let target: LinkTarget | undefined;
                try {
                    target = await pickLinkTarget(this.linkContext(), message.current, message.mode);
                } catch (error) {
                    logger.error('Visual editor: link picker failed', error);
                }
                this.post({ type: 'link', request: message.request, target });
                return;
            }
            case 'openLink': {
                if (message.from !== undefined && message.version === this.document.version) {
                    await this.contextFromRow(message.target, message.from);
                }
                const missing = await openLinkTarget(this.document, message.target);
                if (missing !== undefined) {
                    void vscode.window.showWarningMessage(format(this.labels().linkNotFound, missing));
                }
                return;
            }
            case 'clipboardRead': {
                let text = '';
                try {
                    text = await vscode.env.clipboard.readText();
                } catch {
                    // Unreadable: the page says so.
                }
                this.post({ type: 'clipboardText', request: message.request, text });
                return;
            }
            case 'problemMarks':
                this.problemMarks = message.count;
                return;
            case 'resolvedShown':
                this.resolvedShown = message.texts;
                return;
            case 'edit':
                // One edit at a time, in order: each is checked against the version it was made for.
                this.queue = this.queue.then(() => this.apply(message)).catch((error) => {
                    logger.error('Visual editor: edit failed', error);
                });
                await this.queue;
                return;
            case 'openSource':
                await this.openSource(message.offset);
                return;
            case 'selection':
                this.selection = { stamp: message.stamp, chain: message.chain };
                VisualEditorProvider.sessionChanged(this, undefined);
                return;
            case 'reuse':
                await this.reuse(message);
                return;
            case 'quickFixes':
                await this.quickFixes(message);
                return;
            case 'quickFix':
                await this.quickFix(message);
                return;
            case 'command':
                if (message.command === 'preview') {
                    await vscode.commands.executeCommand('ditacraft.previewHTML5', this.document.uri);
                } else if (message.command === 'properties') {
                    await vscode.commands.executeCommand('ditacraft.showProperties');
                } else if (message.command === 'mapContext') {
                    await MapContexts.get()?.pick(this.document.uri.fsPath);
                }
                return;
            case 'log':
                if (message.level === 'error') {
                    logger.error(`Visual editor: ${message.message}`);
                } else {
                    logger.info(`Visual editor: ${message.message}`);
                }
                return;
        }
    }

    private async apply(message: EditMessage): Promise<void> {
        if (message.baseVersion !== this.document.version) {
            // Computed against text the document no longer has: the page resyncs.
            this.refused++;
            this.post({ type: 'update', version: this.document.version, text: this.document.getText() });
            return;
        }
        const edit = new vscode.WorkspaceEdit();
        edit.replace(this.document.uri, new vscode.Range(this.document.positionAt(message.start), this.document.positionAt(message.end)), message.text);
        this.pendingSelfEdits++;
        this.lastPageEditAt = Date.now();
        const ok = await vscode.workspace.applyEdit(edit);
        if (!ok) {
            this.pendingSelfEdits = Math.max(0, this.pendingSelfEdits - 1);
            this.refused++;
            this.post({ type: 'update', version: this.document.version, text: this.document.getText() });
            return;
        }
        this.applied++;
        this.post({ type: 'ack', version: this.document.version });
    }

    private onDocumentChange(e: vscode.TextDocumentChangeEvent): void {
        if (e.document !== this.document || e.contentChanges.length === 0) {
            return;
        }
        if (this.pendingSelfEdits > 0) {
            this.pendingSelfEdits--;
            return; // our own edit coming back
        }
        const text = this.document.getText();
        const key = this.grammarKeyOf(text);
        if (key !== undefined && key !== this.grammarKey) {
            this.sendInit(); // another document type: another grammar
            return;
        }
        this.post({ type: 'update', version: this.document.version, text });
    }

    // -- images -----------------------------------------------------------------------------------------

    private labels(): Record<string, string> {
        return labelsFor(vscode.env.language).ui;
    }

    private linkContext(): LinkPickerContext {
        const grammar = this.grammar;
        return {
            document: this.document,
            classOf: (name) => grammar?.elements[name]?.class,
            labels: this.labels(),
            nextAnswer: () => VisualEditorProvider.dialogAnswers.shift(),
            rootMap: this.mapContext?.place?.root,
        };
    }

    // -- map context (spec §13.8 M4) -------------------------------------------------------------------

    /** The topic's map context: its keys, and the status line's item. */
    private mapContext: TopicContext | undefined;
    private contextGeneration = 0;
    /** What the status line shows (diagnostics, tests). */
    private contextShown: string | undefined;

    private isMap(): boolean {
        return /\.(ditamap|bookmap)$/i.test(this.document.uri.fsPath);
    }

    /** A key, for this topic: through its map context. */
    private resolveKey(key: string, file: string): Promise<KeyDefinitionLike | null> {
        return MapContexts.get()?.resolveKey(key, file, this.mapContext) ?? getGlobalKeySpaceResolver().resolveKey(key, file);
    }

    /** Find the topic's map context again; when it changed, resolve its references again and tell the page. */
    private refreshContext(force = false): void {
        const contexts = MapContexts.get();
        if (!contexts || this.isMap()) {
            return;
        }
        const generation = ++this.contextGeneration;
        void (async () => {
            const context = await contexts.contextOf(this.document.uri.fsPath);
            if (generation !== this.contextGeneration) {
                return;
            }
            const key = (c: TopicContext | undefined) => JSON.stringify(c ? [c.place?.root, c.place?.maps, c.place?.occurrence, c.place?.info, c.chosen] : null);
            const changed = key(context) !== key(this.mapContext);
            this.mapContext = context;
            if (changed || force) {
                const ui = this.labels();
                const shown = context.place || context.chosen ? (context.place ? placeLabel(context.place) : ui.contextNone) : undefined;
                this.contextShown = shown;
                this.post({ type: 'mapContext', label: shown, title: context.place ? `${ui.chooseContext} — ${path.basename(context.place.root)}${context.place.info.scope ? ` — keyscope ${context.place.info.scope}` : ''}` : ui.chooseContext });
                if (changed) {
                    this.scheduleResolved(0);
                }
            }
        })().catch((error) => logger.error('Visual editor: map context failed', error));
    }

    /** A topic opened from this map's row (the element at `from`): shown in that place of the map. */
    private async contextFromRow(target: LinkTarget, from: number): Promise<void> {
        const contexts = MapContexts.get();
        if (!contexts || !this.isMap()) {
            return;
        }
        const docPath = this.document.uri.fsPath;
        let file: string | undefined;
        if (target.keyref) {
            file = (await getGlobalKeySpaceResolver().resolveKey(target.keyref.split('/')[0], docPath))?.targetFile;
        } else if (target.href && target.scope !== 'external' && !/^[a-z][\w+.-]+:/i.test(target.href)) {
            const ref = parseReference(target.href);
            file = ref.file ? resolvePath(docPath, ref.file) : undefined;
        }
        if (file) {
            await contexts.chooseFromMapRow(file, docPath, this.document.getText(), from);
        }
    }

    private async askText(prompt: string, value: string, placeHolder?: string): Promise<string | undefined> {
        const queued = VisualEditorProvider.dialogAnswers.shift();
        if (queued) {
            return queued.text;
        }
        return vscode.window.showInputBox({ prompt, value, placeHolder, ignoreFocusOut: true });
    }

    private async pickFile(title: string, near: vscode.Uri): Promise<string | undefined> {
        const queued = VisualEditorProvider.dialogAnswers.shift();
        if (queued) {
            return queued.file;
        }
        const ui = this.labels();
        const picked = await vscode.window.showOpenDialog({
            title, openLabel: ui.imagePickLabel, canSelectMany: false, defaultUri: near,
            filters: { [ui.imageFilter]: IMAGE_EXTENSIONS },
        });
        return picked?.[0]?.fsPath;
    }

    /**
     * Images for the page: a file the author picks (and its alternative text), files dropped on
     * the page, or a pasted image saved next to the topic. Answers hrefs relative to the topic.
     */
    private async images(message: Extract<EditorToHost, { type: 'pickImage' | 'imageFiles' | 'saveImage' }>): Promise<void> {
        const reply = (hrefs: string[], extra: { alt?: string; error?: string } = {}): void =>
            this.post({ type: 'images', request: message.request, hrefs, ...extra });
        const docPath = this.document.uri.fsPath;
        const ui = this.labels();
        try {
            if (message.type === 'pickImage') {
                // Start where the image already is (Replace), else in the topic's folder.
                const nearPath = message.near && !/^[a-z][\w+.-]+:/i.test(message.near)
                    ? path.dirname(path.resolve(path.dirname(docPath), decodeURI(message.near.split('#')[0])))
                    : path.dirname(docPath);
                const file = await this.pickFile(message.askAlt ? ui.imagePickTitle : ui.imageReplaceTitle, vscode.Uri.file(nearPath));
                if (!file) {
                    reply([]);
                    return;
                }
                const alt = message.askAlt ? await this.askText(ui.imageAltPrompt, '', ui.imageAltPlaceholder) : undefined;
                reply([hrefFor(docPath, file)], { alt: alt ?? '' });
                return;
            }
            if (message.type === 'imageFiles') {
                const hrefs = message.uris
                    .map((u) => vscode.Uri.parse(u))
                    .filter((u) => u.scheme === 'file' && isImagePath(u.fsPath))
                    .map((u) => hrefFor(docPath, u.fsPath));
                reply(hrefs);
                return;
            }
            // A pasted image: saved in the image folder, named after the topic.
            const folder = pastedImageFolder(configManager.get('imagePasteFolder'), docPath, vscode.workspace.getWorkspaceFolder(this.document.uri)?.uri.fsPath);
            await vscode.workspace.fs.createDirectory(vscode.Uri.file(folder));
            const ext = message.name && isImagePath(message.name) ? path.extname(message.name).slice(1).toLowerCase() : extensionForMime(message.mime);
            const name = pastedImageName(docPath, ext, (n) => fs.existsSync(path.join(folder, n)));
            const file = path.join(folder, name);
            await vscode.workspace.fs.writeFile(vscode.Uri.file(file), Buffer.from(message.data, 'base64'));
            const href = hrefFor(docPath, file);
            vscode.window.setStatusBarMessage(format(ui.imageSaved, href), 5000);
            reply([href]);
        } catch (error) {
            logger.error('Visual editor: image failed', error);
            reply([], { error: error instanceof Error ? error.message : String(error) });
        }
    }

    /**
     * Reused content (spec §13.7): resolve the reuse element at `offset` as the preview does
     * (keys, conrefend ranges, chained reuse) and open the reused source, or answer with the
     * copy that replaces the element. The page applies the copy as one of its own changes, so
     * undo on the page takes it back.
     */
    private async reuse(message: Extract<EditorToHost, { type: 'reuse' }>): Promise<void> {
        const reply = (result: { xml?: string; error?: string }): void => this.post({ type: 'reuseResult', request: message.request, ...result });
        if (message.version !== this.document.version) {
            reply({ error: 'stale' }); // the page's offset is for another text
            return;
        }
        let doc: Document;
        try {
            doc = parse(this.document.getText());
        } catch {
            reply({ error: 'stale' });
            return;
        }
        const el = elementAt(doc, message.offset);
        if (!el) {
            reply({ error: 'stale' });
            return;
        }
        const docPath = this.document.uri.fsPath;
        const grammar = this.grammar;
        const entity = (name: string): string | undefined => grammar?.entities[name];
        const resolver = new ReferenceResolver({
            files: { readText: (p) => readWorkspaceText(p, this.document.uri) },
            keys: { resolveKey: (key, file) => this.resolveKey(key, file) },
            classOf: (name) => grammar?.elements[name]?.class,
            entity,
        });
        try {
            const res = await resolver.resolveReuseOf(el, doc, docPath);
            const parts = res.conrefRange ?? (res.conrefTarget ? [res.conrefTarget] : []);
            const sourcePath = res.sourcePath ?? res.path;
            if (res.unresolved || parts.length === 0 || !res.sourceDoc || !sourcePath) {
                reply({ error: res.unresolved ?? 'no reuse target' });
                return;
            }
            if (message.action === 'open') {
                const target = samePath(sourcePath, docPath) ? this.document : await vscode.workspace.openTextDocument(vscode.Uri.file(sourcePath));
                const position = target.positionAt(parts[0].range.start);
                await vscode.window.showTextDocument(target, { viewColumn: vscode.ViewColumn.Beside, selection: new vscode.Range(position, position) });
                reply({});
                return;
            }
            reply({
                xml: reuseCopy({ doc, docPath, el, parts, sourceDoc: res.sourceDoc, sourcePath, tokensOf: (e) => resolver.tokens(e), entity }),
            });
        } catch (error) {
            logger.error('Visual editor: reuse action failed', error);
            reply({ error: error instanceof Error ? error.message : String(error) });
        }
    }

    private async openSource(offset: number | undefined): Promise<void> {
        const position = this.document.positionAt(offset ?? 0);
        await vscode.window.showTextDocument(this.document, {
            viewColumn: vscode.ViewColumn.Beside,
            selection: new vscode.Range(position, position),
            preserveFocus: false,
        });
    }
}

/** A fix's title as text: without the icons VS Code draws for `$(name)`. */
function fixTitle(action: vscode.CodeAction | vscode.Command): string {
    return action.title.replace(/\$\([\w~-]+\)\s*/g, '').trim();
}

/** A code action provider's plain command (not a CodeAction). */
function isCommand(action: vscode.CodeAction | vscode.Command): action is vscode.Command {
    return typeof (action as vscode.Command).command === 'string';
}

/** The element starting at `offset`. */
function elementAt(doc: Document, offset: number): ElementNode | undefined {
    for (const node of walk(doc.children)) {
        if (isElement(node) && node.range.start === offset) {
            return node;
        }
        if (node.range.start > offset) {
            break;
        }
    }
    return undefined;
}
