/**
 * Visual Preview panel (spec §8, §10, §11): a live, word-processor-like page of the DITA
 * topic in the active editor, rendered without DITA-OT.
 *
 * One panel follows the active DITA editor unless locked. Every edit (no save needed)
 * re-parses the CST and re-renders after a short debounce; references (keys, reuse, link
 * titles) resolve asynchronously and arrive as element patches. The page and the editor
 * scroll together through element ids and source offsets.
 *
 * The webview document is a static shell (pageHtml.ts); content arrives as messages
 * (messages.ts). With retainContextWhenHidden off, a hidden panel is recreated on show and
 * its `ready` handshake replays the current state.
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getGlobalKeySpaceResolver } from '../providers/ditaLinkProvider';
import { ElementIndex } from '../shared/cst/elementIndex';
import { parse, ParseError } from '../shared/cst/parse';
import { attr, findElementById, rootElement } from '../shared/cst/query';
import type { Document, ElementNode } from '../shared/cst/types';
import { format, labelsFor, type Labels } from '../shared/render/labels';
import { findPatchRoot, needsFullRender, renderDocument, renderElement } from '../shared/render/toHtml';
import type { RenderOptions, Resolution } from '../shared/render/types';
import { configManager, type PreviewThemeType } from '../utils/configurationManager';
import { fireAndForget } from '../utils/errorUtils';
import { logger } from '../utils/logger';
import { buildDitavalFilter, type DitavalFilter } from './ditaval';
import type { GrammarRegistry, SelectedGrammar } from './grammarRegistry';
import type { DocMeta, HostToWebview, OpenKind, PreviewSettings, RevealMode, ToolbarCommand, WebviewToHost } from './messages';
import { buildPageHtml } from './pageHtml';
import { mapProblems, type DiagnosticLike } from './problems';
import { isInside, realPathSync, samePath } from './paths';
import { placeLabel } from './mapContext';
import { MapContexts, type TopicContext } from './mapContexts';
import { parseReference, ReferenceResolver, resolvePath } from './resolver';
import { sharedGrammarRegistry } from './sharedRegistry';
import { readWorkspaceText } from './workspaceText';

/** Above this size, references are not resolved automatically (spec §17). */
const LARGE_DOCUMENT_CHARS = 2_000_000;
/** More changed references than this re-send the whole body instead of patches. */
const MAX_PATCHES = 25;
/** Ignore echo events for this long after the other side was scrolled programmatically. */
const SYNC_ECHO_MS = 350;
/** Minimum delay before re-resolving references after a reused or key-defining file changed. */
const RESOLVE_DELAY_MS = 500;
const CONTEXT_KEY = 'ditacraft.visualPreviewOpen';

interface Rendered {
    version: number;
    text: string;
    doc: Document;
    index: ElementIndex;
    grammar: SelectedGrammar;
    path: string;
    resolutions: Map<ElementNode, Resolution>;
    undeclaredEntities: number;
    unknownElements: number;
    referencesSkipped: boolean;
}

interface PersistedState {
    uri?: string;
    locked?: boolean;
}

/**
 * The active preview DITAVAL filter. It lives in commands/previewCommand.ts (shared with
 * the DITA-OT preview and condition highlighting) and is injected here to keep the
 * command module and the panel free of an import cycle.
 */
export interface DitavalSource {
    activePath(): string | undefined;
    onDidChange: vscode.Event<string | undefined>;
}

/** True for documents the visual preview renders: DITA topics (not maps or DITAVAL). */
export function isPreviewableTopic(document: vscode.TextDocument): boolean {
    const ext = path.extname(document.uri.path).toLowerCase();
    if (ext === '.dita') {
        return true;
    }
    if (ext !== '.xml') {
        return false;
    }
    // A .xml file is previewable when it looks like a DITA topic.
    const head = document.getText(new vscode.Range(0, 0, 60, 0));
    return /<!DOCTYPE\s+(?:topic|concept|task|reference|glossentry|glossgroup|troubleshooting|dita)\b/.test(head)
        || /class="-\s+topic\/topic\b/.test(head);
}

function isMapPath(fsPath: string): boolean {
    return /\.(ditamap|bookmap|ditaval)$/i.test(fsPath);
}

export class VisualPreviewPanel implements vscode.Disposable {
    public static readonly viewType = 'ditacraft.visualPreview';
    private static current: VisualPreviewPanel | undefined;
    private static context: vscode.ExtensionContext | undefined;
    private static ditavalSource: DitavalSource | undefined;
    private static registry: GrammarRegistry | undefined;

    private document: vscode.TextDocument | undefined;
    private locked = false;
    private showMarkup: boolean;
    private syncEnabled: boolean;
    private theme: PreviewThemeType;
    private readonly labels: Labels;
    private rendered: Rendered | undefined;
    private renderVersion = 0;
    private resolveGeneration = 0;
    private renderTimer: NodeJS.Timeout | undefined;
    private resolveTimer: NodeJS.Timeout | undefined;
    private readonly resolver: ReferenceResolver;
    private dependencies = new Set<string>();
    private ditaval: DitavalFilter | undefined;
    /** The topic's map context (spec §13.8 M4), once found. */
    private mapContext: TopicContext | undefined;
    private contextGeneration = 0;
    /** The banner's text last sent (diagnostics, tests). */
    private lastBanner: string | undefined;
    private ready = false;
    private lastTopId: string | undefined;
    private lastSelectedId: string | undefined;
    private suppressEditorEventsUntil = 0;
    private suppressPageEventsUntil = 0;
    private resourceRootsKey = '';
    private pageRendered: { version: number; elements: number } | undefined;
    /** Set while the current text is not well-formed (the page shows the last good render). */
    private parseError: { text: string; line: number } | undefined;
    private readonly disposables: vscode.Disposable[] = [];

    // -- static API ---------------------------------------------------------------------

    /** Call once on activation: registers the serializer that revives the panel after a reload. */
    public static initialize(context: vscode.ExtensionContext, ditaval: DitavalSource): void {
        VisualPreviewPanel.context = context;
        VisualPreviewPanel.ditavalSource = ditaval;
        context.subscriptions.push(
            vscode.window.registerWebviewPanelSerializer(VisualPreviewPanel.viewType, {
                deserializeWebviewPanel: async (panel: vscode.WebviewPanel, state: unknown) => {
                    VisualPreviewPanel.revive(panel, (state ?? {}) as PersistedState);
                },
            }),
        );
    }

    public static get instance(): VisualPreviewPanel | undefined {
        return VisualPreviewPanel.current;
    }

    /** Show the preview for `uri` (opening the panel beside the editor if needed). */
    public static async show(uri: vscode.Uri, preserveFocus = false): Promise<void> {
        const document = await vscode.workspace.openTextDocument(uri);
        if (VisualPreviewPanel.current) {
            VisualPreviewPanel.current.setDocument(document, true);
            VisualPreviewPanel.current.panel.reveal(undefined, preserveFocus);
            return;
        }
        const panel = vscode.window.createWebviewPanel(
            VisualPreviewPanel.viewType,
            'DITA Preview',
            { viewColumn: vscode.ViewColumn.Beside, preserveFocus },
            { enableScripts: true, enableFindWidget: true, retainContextWhenHidden: false },
        );
        VisualPreviewPanel.current = new VisualPreviewPanel(panel, document);
    }

    private static revive(panel: vscode.WebviewPanel, state: PersistedState): void {
        if (VisualPreviewPanel.current) {
            // One preview at a time: a second restored panel (or one restored after the
            // preview was already opened) is closed rather than left orphaned.
            panel.dispose();
            return;
        }
        const instance = new VisualPreviewPanel(panel, undefined);
        VisualPreviewPanel.current = instance;
        instance.locked = state.locked === true;
        const uri = state.uri ? vscode.Uri.parse(state.uri) : vscode.window.activeTextEditor?.document.uri;
        if (uri) {
            fireAndForget((async () => {
                try {
                    instance.setDocument(await vscode.workspace.openTextDocument(uri), true);
                } catch {
                    instance.post({ type: 'empty', text: instance.labels.ui.emptyPreview });
                }
            })(), 'visual-preview-revive');
        }
    }

    // -- lifecycle --------------------------------------------------------------------------

    private constructor(private readonly panel: vscode.WebviewPanel, document: vscode.TextDocument | undefined) {
        const context = VisualPreviewPanel.context;
        if (!context) {
            throw new Error('VisualPreviewPanel.initialize() was not called');
        }
        VisualPreviewPanel.registry = sharedGrammarRegistry(context);
        this.labels = labelsFor(vscode.env.language);
        this.showMarkup = configManager.get('previewShowMarkup');
        this.syncEnabled = configManager.get('previewScrollSync');
        this.theme = configManager.get('previewTheme');
        this.panel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'resources', 'ditacraft-logo.png');

        this.resolver = new ReferenceResolver({
            files: { readText: (p) => this.readText(p) },
            // Through the topic's map context (spec §13.8 M4): its place's root map and key scope.
            keys: { resolveKey: (key, file) => MapContexts.get()?.resolveKey(key, file, this.mapContext) ?? getGlobalKeySpaceResolver().resolveKey(key, file) },
            classOf: (name) => this.rendered?.grammar.classOf(name),
            entity: (name) => this.rendered?.grammar.entity(name),
        });

        this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
        this.panel.webview.onDidReceiveMessage((m: WebviewToHost) => this.onMessage(m), null, this.disposables);
        this.registerListeners();
        void vscode.commands.executeCommand('setContext', CONTEXT_KEY, true);

        this.loadDitaval();
        if (document) {
            this.setDocument(document, true);
        } else {
            this.updateResources(true);
        }
    }

    public dispose(): void {
        if (VisualPreviewPanel.current === this) {
            VisualPreviewPanel.current = undefined;
            void vscode.commands.executeCommand('setContext', CONTEXT_KEY, false);
        }
        if (this.renderTimer) {
            clearTimeout(this.renderTimer);
        }
        if (this.resolveTimer) {
            clearTimeout(this.resolveTimer);
        }
        this.resolveGeneration++;
        for (const d of this.disposables.splice(0)) {
            try {
                d.dispose();
            } catch {
                // already disposed
            }
        }
        this.panel.dispose();
    }

    private registerListeners(): void {
        this.disposables.push(
            vscode.workspace.onDidChangeTextDocument((e) => {
                if (e.contentChanges.length === 0) {
                    return;
                }
                if (this.document && e.document === this.document) {
                    this.scheduleRender(configManager.get('previewUpdateDelayMs'));
                } else if (e.document.uri.scheme === 'file' && this.isDependency(e.document.uri.fsPath)) {
                    this.resolver.invalidate(e.document.uri.fsPath);
                    this.scheduleResolve();
                }
            }),
            vscode.workspace.onDidSaveTextDocument((doc) => {
                if (this.document && doc === this.document) {
                    if (configManager.get('previewResolveOnSave')) {
                        this.resolver.invalidate();
                        this.scheduleResolve();
                    }
                } else if (isMapPath(doc.uri.fsPath) || this.isDependency(doc.uri.fsPath)) {
                    // Key definitions or reused files changed.
                    this.resolver.invalidate(doc.uri.fsPath);
                    this.scheduleResolve();
                }
                if (this.ditavalPath() && samePath(doc.uri.fsPath, this.ditavalPath()!)) {
                    this.loadDitaval();
                }
            }),
            vscode.window.onDidChangeActiveTextEditor((editor) => {
                if (!this.locked && editor && editor.document !== this.document && isPreviewableTopic(editor.document)) {
                    this.setDocument(editor.document, false);
                }
            }),
            vscode.window.onDidChangeTextEditorVisibleRanges((e) => {
                if (!this.syncEnabled || e.textEditor.document !== this.document || Date.now() < this.suppressEditorEventsUntil) {
                    return;
                }
                const range = e.visibleRanges[0];
                if (range) {
                    this.revealInPage(e.textEditor.document.offsetAt(new vscode.Position(range.start.line, 0)), 'top', false);
                }
            }),
            vscode.window.onDidChangeTextEditorSelection((e) => {
                if (!this.syncEnabled || e.textEditor.document !== this.document || e.kind === vscode.TextEditorSelectionChangeKind.Command) {
                    return;
                }
                if (Date.now() < this.suppressEditorEventsUntil) {
                    return;
                }
                // A click centres and flashes the element; typing only keeps it in view.
                const mouse = e.kind === vscode.TextEditorSelectionChangeKind.Mouse;
                this.revealInPage(e.textEditor.document.offsetAt(e.selections[0].active), mouse ? 'center' : 'nearest', mouse);
            }),
            vscode.languages.onDidChangeDiagnostics((e) => {
                if (this.document && e.uris.some((u) => u.toString() === this.document!.uri.toString())) {
                    this.postProblems();
                }
            }),
            VisualPreviewPanel.ditavalSource!.onDidChange(() => this.loadDitaval()),
            ...(MapContexts.get() ? [MapContexts.get()!.onDidChange((topic) => {
                if (!topic || (this.document && samePath(topic, this.document.uri.fsPath))) {
                    this.refreshContext();
                }
            })] : []),
            vscode.workspace.onDidChangeConfiguration((e) => this.onConfiguration(e)),
            vscode.workspace.onDidGrantWorkspaceTrust(() => {
                this.updateResources(true);
                this.renderNow();
            }),
        );
    }

    // -- document -----------------------------------------------------------------------------

    private setDocument(document: vscode.TextDocument, force: boolean): void {
        if (!force && document === this.document) {
            return;
        }
        if (isMapPath(document.uri.fsPath)) {
            this.post({ type: 'empty', text: this.labels.ui.mapNotSupported });
            return;
        }
        const changed = document !== this.document;
        this.document = document;
        if (changed) {
            this.rendered = undefined;
            this.lastTopId = undefined;
            this.lastSelectedId = undefined;
            this.dependencies.clear();
            this.mapContext = undefined;
        }
        this.updateTitle();
        this.updateResources(false);
        this.renderNow();
        if (changed) {
            this.refreshContext();
        }
    }

    // -- map context (spec §13.8 M4) ---------------------------------------------------------------

    /** Find the topic's map context again; when it changed, render with it (keys, language, filter). */
    private refreshContext(): void {
        const document = this.document;
        const contexts = MapContexts.get();
        if (!document || !contexts) {
            return;
        }
        const generation = ++this.contextGeneration;
        fireAndForget((async () => {
            const context = await contexts.contextOf(document.uri.fsPath);
            if (generation !== this.contextGeneration || document !== this.document) {
                return;
            }
            const key = (c: TopicContext | undefined) => JSON.stringify(c ? [c.place?.root, c.place?.maps, c.place?.occurrence, c.place?.info, c.chosen] : null);
            const changed = key(context) !== key(this.mapContext);
            this.mapContext = context;
            if (changed) {
                this.renderNow();
            }
        })(), 'visual-preview-context');
    }

    /** The language of the generated text (note labels…): the topic's, else the one its map gives it, else VS Code's. */
    private contentLanguage(r: Rendered): string {
        const root = rootElement(r.doc);
        return (root ? attr(root, 'xml:lang') : undefined) || this.mapContext?.place?.info.inherited['xml:lang'] || vscode.env.language;
    }

    /** Why the active filter excludes the topic in its map (the metadata the map gives it), if it does. */
    private contextExclusion(): string | undefined {
        const inherited = this.mapContext?.place?.info.inherited;
        const ditaval = this.ditaval;
        if (!inherited || !ditaval) {
            return undefined;
        }
        const values = Object.fromEntries(Object.entries(inherited).filter(([name]) => !['xml:lang', 'dir', 'translate'].includes(name)));
        if (!ditaval.excludes(values)) {
            return undefined;
        }
        return format(this.labels.ui.contextExcluded, ditaval.label, Object.entries(values).map(([n, v]) => `${n}="${v}"`).join(' '));
    }

    private updateTitle(): void {
        const name = this.document ? path.basename(this.document.uri.fsPath) : 'DITA';
        this.panel.title = this.locked ? `[Preview] ${name}` : `Preview ${name}`;
    }

    private ditavalPath(): string | undefined {
        return VisualPreviewPanel.ditavalSource?.activePath();
    }

    private loadDitaval(): void {
        const file = this.ditavalPath();
        if (!file) {
            this.ditaval = undefined;
            this.renderNow();
            return;
        }
        fireAndForget((async () => {
            const text = await this.readText(file);
            this.ditaval = text === null ? undefined : buildDitavalFilter(text, file, (abs) => this.webviewUri(abs));
            this.renderNow();
        })(), 'visual-preview-ditaval');
    }

    private isDependency(fsPath: string): boolean {
        for (const dep of this.dependencies) {
            if (samePath(dep, fsPath)) {
                return true;
            }
        }
        return false;
    }

    /** Text of a file: an open editor's (possibly unsaved) text wins over the disk. */
    private readText(filePath: string): Promise<string | null> {
        return readWorkspaceText(filePath, this.document?.uri);
    }

    // -- webview resources ------------------------------------------------------------------

    private resourceRoots(): vscode.Uri[] {
        const context = VisualPreviewPanel.context!;
        const roots: vscode.Uri[] = [context.extensionUri];
        const trusted = vscode.workspace.isTrusted;
        const docFolder = this.document ? vscode.workspace.getWorkspaceFolder(this.document.uri) : undefined;
        for (const folder of vscode.workspace.workspaceFolders ?? []) {
            if (trusted || folder === docFolder) {
                roots.push(folder.uri);
            }
        }
        if (this.document?.uri.scheme === 'file') {
            roots.push(vscode.Uri.file(path.dirname(this.document.uri.fsPath)));
        }
        const css = this.customCssPath();
        if (css) {
            roots.push(vscode.Uri.file(path.dirname(css)));
        }
        return roots;
    }

    /** Resolve `ditacraft.previewCustomCss` (with ${workspaceFolder}); undefined when unset or untrusted. */
    private customCssPath(): string | undefined {
        const setting = configManager.get('previewCustomCss');
        if (!setting || !vscode.workspace.isTrusted) {
            return undefined;
        }
        const folder = (this.document && vscode.workspace.getWorkspaceFolder(this.document.uri)) ?? vscode.workspace.workspaceFolders?.[0];
        const resolved = folder ? setting.replace(/\$\{workspaceFolder\}/g, folder.uri.fsPath) : setting;
        const absolute = path.isAbsolute(resolved) ? resolved : folder ? path.join(folder.uri.fsPath, resolved) : resolved;
        return fs.existsSync(absolute) ? absolute : undefined;
    }

    /** (Re)assign the webview shell when its resources changed (or when forced). */
    private updateResources(force: boolean): void {
        const roots = this.resourceRoots();
        const key = JSON.stringify([roots.map((r) => r.toString()), this.customCssPath() ?? '', vscode.workspace.isTrusted]);
        if (!force && key === this.resourceRootsKey) {
            return;
        }
        this.resourceRootsKey = key;
        const webview = this.panel.webview;
        webview.options = { enableScripts: true, localResourceRoots: roots };
        const context = VisualPreviewPanel.context!;
        const version = String((context.extension.packageJSON as { version?: string }).version ?? '0');
        const asset = (file: string) => webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'out', 'webview', file)).toString() + `?v=${version}`;
        const css = this.customCssPath();
        this.ready = false;
        webview.html = buildPageHtml({
            cspSource: webview.cspSource,
            nonce: crypto.randomBytes(16).toString('base64'),
            scriptUri: asset('preview.js'),
            styleUri: asset('preview.css'),
            customCssUri: css ? webview.asWebviewUri(vscode.Uri.file(css)).toString() : undefined,
            lang: vscode.env.language,
        });
    }

    /** A webview URL for a local file, or undefined when it cannot be served. */
    private webviewUri(absolutePath: string): string | undefined {
        const file = vscode.Uri.file(absolutePath);
        // In Restricted Mode a link inside an allowed folder must not lead outside it.
        const checked = vscode.workspace.isTrusted ? absolutePath : realPathSync(absolutePath);
        const allowed = this.resourceRoots().some((root) => root.scheme === 'file'
            && isInside(checked, vscode.workspace.isTrusted ? root.fsPath : realPathSync(root.fsPath)));
        return allowed ? this.panel.webview.asWebviewUri(file).toString() : undefined;
    }

    private imageSrc(href: string, sourcePath: string | undefined): string | undefined {
        if (/^data:image\//i.test(href)) {
            return href;
        }
        // A URI scheme has 2+ characters, so C:\img.png is a local path, not a URL.
        if (/^[a-z][\w+.-]+:/i.test(href) && !/^file:/i.test(href)) {
            return undefined; // remote images are blocked by the page's CSP
        }
        const base = sourcePath ?? this.rendered?.path ?? this.document?.uri.fsPath;
        if (!base) {
            return undefined;
        }
        const clean = href.replace(/[?#].*$/, '');
        const absolute = path.isAbsolute(clean) ? clean : resolvePath(base, clean);
        return this.webviewUri(absolute);
    }

    // -- rendering -----------------------------------------------------------------------------

    private scheduleRender(delay: number): void {
        if (this.renderTimer) {
            clearTimeout(this.renderTimer);
        }
        this.renderTimer = setTimeout(() => {
            this.renderTimer = undefined;
            this.renderNow();
        }, delay);
    }

    /** Re-resolve after a dependency changed: debounced, as typing in a reused file fires per key. */
    private scheduleResolve(): void {
        if (this.resolveTimer) {
            clearTimeout(this.resolveTimer);
        }
        this.resolveTimer = setTimeout(() => {
            this.resolveTimer = undefined;
            if (this.rendered) {
                fireAndForget(this.resolveReferences(this.rendered.version), 'visual-preview-resolve');
            }
        }, Math.max(RESOLVE_DELAY_MS, configManager.get('previewUpdateDelayMs')));
    }

    private renderOptions(r: Rendered): RenderOptions {
        const ditaval = this.ditaval;
        return {
            index: r.index,
            classOf: r.grammar.classOf,
            entity: r.grammar.entity,
            labels: labelsFor(this.contentLanguage(r)),
            showMarkup: this.showMarkup,
            resolutions: r.resolutions,
            filter: ditaval ? (el) => ditaval.evaluate(el) : undefined,
            showExcluded: configManager.get('previewShowExcluded'),
            imageSrc: (href, _el, sourcePath) => this.imageSrc(href, sourcePath),
        };
    }

    private renderNow(): void {
        if (this.renderTimer) {
            clearTimeout(this.renderTimer);
            this.renderTimer = undefined;
        }
        const document = this.document;
        if (!document) {
            this.post({ type: 'empty', text: this.labels.ui.emptyPreview });
            return;
        }
        const text = document.getText();
        let doc: Document;
        try {
            doc = parse(text);
        } catch (error) {
            if (error instanceof ParseError) {
                // Keep the last good render on the page (spec §5.5).
                const line = document.positionAt(error.offset).line + 1;
                this.parseError = { text: format(this.labels.ui.waitingForXml, line, error.reason), line };
                this.post({ type: 'banner', kind: 'parse', ...this.parseError });
                if (!this.rendered) {
                    this.post({ type: 'empty', text: this.parseError.text });
                }
                return;
            }
            logger.error('Visual preview: parse failed', error);
            return;
        }
        this.parseError = undefined;

        const started = Date.now();
        const grammar = VisualPreviewPanel.registry!.select(doc, {
            externalCatalogPath: vscode.workspace.isTrusted ? this.externalCatalog(document) : undefined,
            ditaVersion: vscode.workspace.getConfiguration('ditacraft', document.uri).get<string>('ditaVersion', 'auto'),
        });
        const previous = this.rendered;
        const referencesSkipped = !configManager.get('previewResolveReferences') || text.length > LARGE_DOCUMENT_CHARS;
        const rendered: Rendered = {
            version: ++this.renderVersion,
            text,
            doc,
            index: new ElementIndex(doc),
            grammar,
            path: document.uri.fsPath,
            resolutions: new Map(),
            undeclaredEntities: 0,
            unknownElements: 0,
            referencesSkipped,
        };
        // Carry previous resolutions over to identical references so keyref text does not
        // flicker while typing; the async pass below refreshes them.
        if (previous && !referencesSkipped) {
            rendered.resolutions = carryResolutions(previous, rendered, this.resolver);
        }
        this.rendered = rendered;

        const result = renderDocument(doc, this.renderOptions(rendered));
        rendered.undeclaredEntities = result.undeclaredEntities.length;
        rendered.unknownElements = result.unknownElements.length;
        this.post({ type: 'body', version: rendered.version, html: result.html, meta: this.meta(rendered), anchor: this.lastTopId });
        this.postInfoBanner(rendered, result.undeclaredEntities); // also clears a parse-error banner
        this.postProblems();
        logger.debug('Visual preview rendered', { file: path.basename(rendered.path), ms: Date.now() - started, chars: text.length });

        if (!referencesSkipped) {
            fireAndForget(this.resolveReferences(rendered.version), 'visual-preview-resolve');
        }
    }

    private postInfoBanner(r: Rendered, undeclared: string[]): void {
        const excluded = this.contextExclusion();
        this.lastBanner = this.parseError?.text ?? excluded;
        if (this.parseError) {
            this.post({ type: 'banner', kind: 'parse', ...this.parseError });
        } else if (excluded) {
            this.post({ type: 'banner', kind: 'info', text: excluded });
        } else if (r.referencesSkipped && r.text.length > LARGE_DOCUMENT_CHARS) {
            this.post({ type: 'banner', kind: 'info', text: this.labels.ui.largeDocument });
        } else if (undeclared.length > 0) {
            this.post({ type: 'banner', kind: 'info', text: `${format(this.labels.ui.undeclaredEntities, undeclared.length)}: ${undeclared.map((n) => `&${n};`).join(' ')}` });
        } else {
            this.post({ type: 'banner', kind: null });
        }
    }

    private externalCatalog(document: vscode.TextDocument): string | undefined {
        const setting = vscode.workspace.getConfiguration('ditacraft', document.uri).get<string>('xmlCatalogPath', '');
        if (!setting) {
            return undefined;
        }
        const folder = vscode.workspace.getWorkspaceFolder(document.uri) ?? vscode.workspace.workspaceFolders?.[0];
        const resolved = folder ? setting.replace(/\$\{workspaceFolder\}/g, folder.uri.fsPath) : setting;
        const absolute = path.isAbsolute(resolved) ? resolved : folder ? path.join(folder.uri.fsPath, resolved) : resolved;
        return fs.existsSync(absolute) ? absolute : undefined;
    }

    private meta(r: Rendered): DocMeta {
        return {
            uri: this.document?.uri.toString() ?? '',
            fileName: path.basename(r.path),
            grammarId: r.grammar.id,
            grammarLabel: r.grammar.fallback ? `${r.grammar.label} — ${this.labels.ui.fallbackGrammar}` : r.grammar.label,
            fallback: r.grammar.fallback,
            ditaval: this.ditaval?.label,
            context: this.contextMeta(),
            undeclaredEntities: r.undeclaredEntities,
            unknownElements: r.unknownElements,
            referencesSkipped: r.referencesSkipped,
        };
    }

    /** The map context for the status line: its place (the navigation above the topic), or none. */
    private contextMeta(): DocMeta['context'] {
        const c = this.mapContext;
        if (!c || (!c.place && !c.chosen)) {
            return undefined;
        }
        const label = c.place ? placeLabel(c.place) : this.labels.ui.contextNone;
        const scope = c.place?.info.scope ? ` — keyscope ${c.place.info.scope}` : '';
        return { label, title: `${this.labels.ui.chooseContext}${c.place ? ` — ${path.basename(c.place.root)}${scope}` : ''}` };
    }

    /** Resolve references of render `version`, then patch (or re-render) what changed. */
    private async resolveReferences(version: number): Promise<void> {
        const r = this.rendered;
        if (!r || r.version !== version || r.referencesSkipped) {
            return;
        }
        const generation = ++this.resolveGeneration;
        let outcome;
        try {
            outcome = await this.resolver.resolve(r.doc, r.path);
        } catch (error) {
            logger.warn('Visual preview: reference resolution failed', { error: String(error) });
            return;
        }
        if (generation !== this.resolveGeneration || this.rendered !== r) {
            return; // superseded by a newer render or resolution pass
        }
        this.dependencies = outcome.dependencies;
        const changed = [...outcome.resolutions.keys()].filter((el) =>
            r.index.idOf(el) !== undefined && fingerprint(outcome.resolutions.get(el)) !== fingerprint(r.resolutions.get(el)));
        const removed = [...r.resolutions.keys()].filter((el) => r.index.idOf(el) !== undefined && !outcome.resolutions.has(el));
        r.resolutions = outcome.resolutions;
        const touched = [...changed, ...removed];
        if (touched.length === 0) {
            return;
        }
        const options = this.renderOptions(r);
        // Patch self-contained elements only (a cell's table, a caption's figure…).
        const roots = [...new Set(touched.map((el) => findPatchRoot(el, options)))];
        const top = roots.filter((el) => !hasAncestorIn(el, roots));
        if (top.length > MAX_PATCHES || top.some((el) => needsFullRender(el, options))) {
            const result = renderDocument(r.doc, options);
            this.post({ type: 'body', version: r.version, html: result.html, meta: this.meta(r), anchor: this.lastTopId });
            this.postProblems();
            return;
        }
        const items = top.map((el) => ({ id: r.index.idOf(el)!, html: renderElement(r.doc, el, options) }));
        this.post({ type: 'patch', version: r.version, items });
    }

    private postProblems(): void {
        const r = this.rendered;
        const document = this.document;
        // While the text is not well-formed, diagnostics' offsets do not match the parse the
        // page shows: keep the marks it has.
        if (!r || !document || !this.ready || this.parseError) {
            return;
        }
        const severity = (s: vscode.DiagnosticSeverity): DiagnosticLike['severity'] =>
            s === vscode.DiagnosticSeverity.Error ? 'error'
                : s === vscode.DiagnosticSeverity.Warning ? 'warning'
                    : s === vscode.DiagnosticSeverity.Information ? 'info' : 'hint';
        const diagnostics: DiagnosticLike[] = vscode.languages.getDiagnostics(document.uri).map((d) => ({
            start: document.offsetAt(d.range.start),
            line: d.range.start.line + 1,
            severity: severity(d.severity),
            message: d.message,
            code: typeof d.code === 'object' ? String(d.code.value) : d.code !== undefined ? String(d.code) : undefined,
            source: d.source,
        }));
        this.post({ type: 'problems', version: r.version, items: mapProblems(diagnostics, r.index) });
    }

    // -- messages ---------------------------------------------------------------------------------

    private post(message: HostToWebview): void {
        if (!this.ready && message.type !== 'settings') {
            return; // replayed on `ready`
        }
        void this.panel.webview.postMessage(message);
    }

    private settings(): PreviewSettings {
        return {
            pageWidth: configManager.get('previewPageWidth'),
            showMarkup: this.showMarkup,
            syncEnabled: this.syncEnabled,
            locked: this.locked,
            theme: this.theme,
            ui: this.labels.ui,
        };
    }

    private onMessage(message: WebviewToHost): void {
        switch (message.type) {
            case 'ready':
                this.ready = true;
                this.post({ type: 'settings', settings: this.settings() });
                if (this.rendered) {
                    // Replay the current page (the webview was recreated).
                    const result = renderDocument(this.rendered.doc, this.renderOptions(this.rendered));
                    this.post({ type: 'body', version: this.rendered.version, html: result.html, meta: this.meta(this.rendered), anchor: this.lastTopId });
                    this.postInfoBanner(this.rendered, result.undeclaredEntities);
                    this.postProblems();
                } else {
                    this.renderNow();
                }
                return;
            case 'rendered':
                this.pageRendered = { version: message.version, elements: message.elements };
                return;
            case 'scroll':
                if (!this.isCurrentPage(message.version)) {
                    return; // the id belongs to a previous parse
                }
                this.lastTopId = message.id;
                if (this.syncEnabled && Date.now() >= this.suppressPageEventsUntil) {
                    this.revealInEditor(message.id, false);
                }
                return;
            case 'select':
                if (!this.isCurrentPage(message.version)) {
                    return;
                }
                this.lastSelectedId = message.id;
                if (this.syncEnabled) {
                    this.revealInEditor(message.id, true);
                }
                return;
            case 'open':
                if (message.id !== undefined && !this.isCurrentPage(message.version)) {
                    return;
                }
                fireAndForget(this.open(message.kind, message.id, message.line), 'visual-preview-open');
                return;
            case 'command':
                this.runCommand(message.command);
                return;
        }
    }

    /** True when element ids from page `version` map onto the current parse. */
    private isCurrentPage(version: number): boolean {
        return this.rendered?.version === version;
    }

    private runCommand(command: ToolbarCommand): void {
        switch (command) {
            case 'refresh':
                this.resolver.invalidate();
                this.renderNow();
                return;
            case 'chooseContext':
                if (this.document) {
                    fireAndForget(MapContexts.get()?.pick(this.document.uri.fsPath) ?? Promise.resolve(), 'visual-preview-choose-context');
                }
                return;
            case 'openSource':
                fireAndForget(this.openSource(), 'visual-preview-open-source');
                return;
            case 'toggleSync':
                this.syncEnabled = !this.syncEnabled;
                this.post({ type: 'settings', settings: this.settings() });
                return;
            case 'cycleTheme': {
                const order: PreviewThemeType[] = ['auto', 'light', 'dark'];
                this.theme = order[(order.indexOf(this.theme) + 1) % order.length];
                this.post({ type: 'settings', settings: this.settings() });
                return;
            }
            case 'previewDitaOt':
                if (this.document) {
                    void vscode.commands.executeCommand('ditacraft.previewDitaOt', this.document.uri);
                }
                return;
            case 'toggleMarkup':
                this.toggleMarkup();
                return;
            case 'toggleLock':
                this.toggleLock();
                return;
        }
    }

    // -- commands (also bound to the command palette) -------------------------------------------

    public toggleMarkup(): void {
        this.showMarkup = !this.showMarkup;
        this.post({ type: 'settings', settings: this.settings() });
        this.renderNow();
    }

    public toggleLock(): void {
        this.locked = !this.locked;
        this.updateTitle();
        this.post({ type: 'settings', settings: this.settings() });
        if (!this.locked) {
            const editor = vscode.window.activeTextEditor;
            if (editor && isPreviewableTopic(editor.document)) {
                this.setDocument(editor.document, false);
            }
        }
    }

    /** The topic shown. */
    public get currentDocument(): vscode.TextDocument | undefined {
        return this.document;
    }

    /** State snapshot for integration tests and diagnostics. */
    public debugState(): {
        uri?: string; version: number; grammarId?: string; fallback?: boolean; locked: boolean; ready: boolean;
        resolved: number; pageVersion?: number; pageElements?: number; text?: string;
        mapContext?: string; contentLang?: string; banner?: string;
    } {
        return {
            uri: this.document?.uri.toString(),
            version: this.rendered?.version ?? 0,
            grammarId: this.rendered?.grammar.id,
            fallback: this.rendered?.grammar.fallback,
            locked: this.locked,
            ready: this.ready,
            resolved: this.rendered?.resolutions.size ?? 0,
            pageVersion: this.pageRendered?.version,
            pageElements: this.pageRendered?.elements,
            text: this.rendered?.text,
            mapContext: this.contextMeta()?.label,
            contentLang: this.rendered ? this.contentLanguage(this.rendered) : undefined,
            banner: this.lastBanner,
        };
    }

    /** Open the previewed topic in an editor, at the element last selected on the page. */
    public async openSource(id = this.lastSelectedId ?? this.lastTopId): Promise<void> {
        if (!this.document) {
            return;
        }
        const offset = id && !this.parseError ? this.rendered?.index.openingTagOffset(id) : undefined;
        await this.openFileAt(this.document.uri, offset);
    }

    // -- sync ---------------------------------------------------------------------------------------

    private revealInPage(offset: number, mode: RevealMode, highlight: boolean): void {
        const r = this.rendered;
        // Offsets into malformed text do not map onto the last good parse.
        if (!r || this.parseError) {
            return;
        }
        const ids = r.index.chainAt(offset);
        if (ids.length > 0) {
            this.suppressPageEventsUntil = Date.now() + SYNC_ECHO_MS;
            this.post({ type: 'reveal', ids, mode, highlight });
        }
    }

    private revealInEditor(id: string, select: boolean): void {
        const r = this.rendered;
        const document = this.document;
        const offset = this.parseError ? undefined : r?.index.openingTagOffset(id);
        if (!document || offset === undefined) {
            return;
        }
        const editor = vscode.window.visibleTextEditors.find((e) => e.document === document);
        if (!editor) {
            return;
        }
        const position = document.positionAt(offset);
        this.suppressEditorEventsUntil = Date.now() + SYNC_ECHO_MS;
        if (select) {
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
        } else {
            editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.AtTop);
        }
    }

    // -- navigation ---------------------------------------------------------------------------------

    private async open(kind: OpenKind, id: string | undefined, line: number | undefined): Promise<void> {
        const r = this.rendered;
        const document = this.document;
        if (!r || !document) {
            return;
        }
        if (kind === 'line' && line !== undefined) {
            await this.openFileAt(document.uri, document.offsetAt(new vscode.Position(Math.max(0, line - 1), 0)));
            return;
        }
        const el = id ? r.index.element(id) : undefined;
        if (!el || kind === 'source') {
            await this.openSource(id);
            return;
        }
        const res = r.resolutions.get(el);
        if (res?.path) {
            await this.openFileAt(vscode.Uri.file(res.path), undefined, res.fragment);
            return;
        }
        const href = attr(el, 'href');
        if (kind === 'link' && href) {
            if (/^(https?|mailto|ftp):/i.test(href)) {
                await vscode.env.openExternal(vscode.Uri.parse(href));
                return;
            }
            const ref = parseReference(href);
            const target = ref.file ? vscode.Uri.file(resolvePath(r.path, ref.file)) : document.uri;
            await this.openFileAt(target, undefined, ref.fragment);
            return;
        }
        await this.openSource(id);
    }

    /** Open a file beside the preview, at an offset or at the element a fragment names. */
    private async openFileAt(uri: vscode.Uri, offset?: number, fragment?: string): Promise<void> {
        let doc: vscode.TextDocument;
        try {
            doc = await vscode.workspace.openTextDocument(uri);
        } catch {
            void vscode.window.showWarningMessage(`DITA Craft: cannot open ${uri.fsPath}`);
            return;
        }
        let at = offset;
        if (at === undefined && fragment) {
            try {
                const parsed = parse(doc.getText());
                const [topicId, elemId] = fragment.split('/');
                const scope = topicId ? findElementById(parsed.children, topicId) : rootElement(parsed);
                const target = elemId && scope ? findElementById(scope.children, elemId) : scope;
                at = target?.openTagRange.start;
            } catch {
                // Malformed target: open at the top.
            }
        }
        const existing = vscode.window.visibleTextEditors.find((e) => e.document === doc);
        const editor = await vscode.window.showTextDocument(doc, {
            viewColumn: existing?.viewColumn ?? vscode.ViewColumn.One,
            preserveFocus: false,
        });
        if (at !== undefined) {
            const position = doc.positionAt(at);
            this.suppressEditorEventsUntil = Date.now() + SYNC_ECHO_MS;
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
        }
    }

    // -- configuration ------------------------------------------------------------------------------

    private onConfiguration(e: vscode.ConfigurationChangeEvent): void {
        if (!e.affectsConfiguration('ditacraft')) {
            return;
        }
        if (e.affectsConfiguration('ditacraft.previewCustomCss')) {
            this.updateResources(true);
        }
        if (e.affectsConfiguration('ditacraft.previewTheme')) {
            this.theme = configManager.get('previewTheme');
        }
        if (e.affectsConfiguration('ditacraft.previewScrollSync')) {
            this.syncEnabled = configManager.get('previewScrollSync');
        }
        if (e.affectsConfiguration('ditacraft.previewShowMarkup')) {
            this.showMarkup = configManager.get('previewShowMarkup');
        }
        if (e.affectsConfiguration('ditacraft.xmlCatalogPath') || e.affectsConfiguration('ditacraft.ditaVersion')) {
            VisualPreviewPanel.registry?.reset();
        }
        this.post({ type: 'settings', settings: this.settings() });
        if (['previewShowExcluded', 'previewResolveReferences', 'previewShowMarkup', 'xmlCatalogPath', 'ditaVersion']
            .some((key) => e.affectsConfiguration(`ditacraft.${key}`))) {
            this.renderNow();
        }
    }
}

// ---------------------------------------------------------------------------------------------------

const objectIds = new WeakMap<object, number>();
let nextObjectId = 1;

/** Stable small id for an object (each re-parse of a file yields a new Document). */
function objectId(value: object | undefined): number {
    if (!value) {
        return 0;
    }
    let id = objectIds.get(value);
    if (id === undefined) {
        id = nextObjectId++;
        objectIds.set(value, id);
    }
    return id;
}

/** Comparable digest of a resolution; reused content compares by identity of its parse. */
function fingerprint(res: Resolution | undefined): string {
    if (!res) {
        return '';
    }
    return JSON.stringify([res.kind, res.text, res.path, res.fragment, res.from, res.unresolved, res.key,
        objectId(res.conrefTarget), objectId(res.conrefChildren), objectId(res.conrefRange?.[0]), objectId(res.sourceDoc),
        objectId(res.foreignRoot)]);
}

function hasAncestorIn(el: ElementNode, set: readonly ElementNode[]): boolean {
    for (let p = el.parent; p; p = p.parent) {
        if (set.includes(p)) {
            return true;
        }
    }
    return false;
}

/** Signature of a reference: what it points at, independent of the parse it came from. */
function referenceSignature(el: ElementNode): string {
    return [el.name, attr(el, 'conref'), attr(el, 'conkeyref'), attr(el, 'conrefend'), attr(el, 'keyref'), attr(el, 'href')].join('|');
}

/** Reuse the previous render's resolutions for references that did not change. */
function carryResolutions(previous: Rendered, next: Rendered, resolver: ReferenceResolver): Map<ElementNode, Resolution> {
    const bySignature = new Map<string, Resolution>();
    const out = new Map<ElementNode, Resolution>();
    for (const [el, res] of previous.resolutions) {
        if (previous.index.idOf(el) !== undefined) {
            bySignature.set(referenceSignature(el), res);
        } else {
            // References inside reused content are keyed by the other file's (cached) nodes.
            out.set(el, res);
        }
    }
    if (bySignature.size === 0) {
        return out;
    }
    for (const request of resolver.collect(next.doc)) {
        const res = bySignature.get(referenceSignature(request.el));
        if (res) {
            out.set(request.el, res);
        }
    }
    return out;
}
