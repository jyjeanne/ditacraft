/**
 * Properties pane (spec §13.4): a view in the DitaCraft side bar listing the attributes of
 * the element at the cursor, from the grammar (types, enumerations, defaults, required),
 * with the project's subject-scheme values offered for profiling attributes.
 *
 * It follows the active DITA editor:
 * - the visual editor: the page reports the elements around its cursor; a change goes back
 *   to the page as an editor transaction (so the page's undo covers it) and reaches the
 *   document as a minimal text edit;
 * - the text editor: the element at the cursor in the parsed source; a change is a minimal
 *   text edit of that element's start tag (the tag's layout kept, see shared/cst/openTag.ts).
 */

import * as crypto from 'crypto';
import * as path from 'path';
import * as vscode from 'vscode';
import { VisualEditorProvider } from '../editor/visualEditorProvider';
import { getLanguageClient } from '../languageClient';
import { grammarSelectOptions } from '../preview/grammarOptions';
import { sharedGrammarRegistry } from '../preview/sharedRegistry';
import { ElementIndex } from '../shared/cst/elementIndex';
import { rewriteOpenTag, withAttribute, type AttributePairs } from '../shared/cst/openTag';
import { parse } from '../shared/cst/parse';
import type { Document, ElementNode } from '../shared/cst/types';
import { checkValue, idConflict, propertiesOf } from '../shared/editor/properties';
import type { Grammar } from '../shared/grammar/types';
import { decodeXmlText } from '../shared/render/html';
import { labelsFor, type Labels } from '../shared/render/labels';
import { logger } from '../utils/logger';
import type { HostToProperties, PropertiesState, PropertiesToHost } from './messages';

interface ChainEntry {
    name: string;
    xml: AttributePairs;
    editable: boolean;
    reason?: string;
}

/** The element chain the pane shows, and how to change it. */
interface Target {
    source: 'visual' | 'text';
    document: vscode.TextDocument;
    grammar: Grammar | undefined;
    chain: ChainEntry[];
    message?: string;
    /** Apply new attributes to chain[index]; resolves to an error message, or undefined. */
    apply(index: number, xml: AttributePairs): Promise<string | undefined>;
    idInUse(index: number, id: string): boolean;
}

interface Parsed {
    uri: string;
    version: number;
    cst: Document;
    index: ElementIndex;
    grammar: Grammar | undefined;
    classOf: (name: string) => string | undefined;
    entity: (name: string) => string | undefined;
}

const SCHEME_TTL_MS = 30_000;

export function isDitaDocument(document: vscode.TextDocument): boolean {
    if (document.uri.scheme !== 'file' && document.uri.scheme !== 'untitled') {
        return false;
    }
    return document.languageId === 'dita' || /\.(dita|ditamap|bookmap)$/i.test(document.uri.path);
}

export class PropertiesViewProvider implements vscode.WebviewViewProvider, vscode.Disposable {
    public static readonly viewType = 'ditacraft.propertiesView';
    private static instance: PropertiesViewProvider | undefined;

    private view: vscode.WebviewView | undefined;
    private ready = false;
    private target: Target | undefined;
    private selected = 0;
    /** Identity of the innermost element shown, to reset the ancestor choice when it changes. */
    private head = '';
    private parsed: Parsed | undefined;
    private readonly labels: Labels = labelsFor(vscode.env.language);
    private readonly schemes = new Map<string, { at: number; values: Record<string, string[]> }>();
    private timer: NodeJS.Timeout | undefined;
    private lastState: PropertiesState | undefined;
    private readonly disposables: vscode.Disposable[] = [];

    private constructor(private readonly context: vscode.ExtensionContext) {
        this.disposables.push(
            vscode.window.onDidChangeActiveTextEditor(() => this.schedule(0)),
            vscode.window.onDidChangeTextEditorSelection((e) => {
                if (e.textEditor === vscode.window.activeTextEditor) {
                    this.schedule(120);
                }
            }),
            vscode.workspace.onDidChangeTextDocument((e) => {
                if (this.target?.document === e.document && e.contentChanges.length > 0) {
                    this.schedule(120);
                }
            }),
            VisualEditorProvider.onDidChangeSelection(() => this.schedule(0)),
            vscode.window.tabGroups.onDidChangeTabs(() => this.schedule(0)),
        );
    }

    public static register(context: vscode.ExtensionContext): vscode.Disposable {
        const provider = new PropertiesViewProvider(context);
        PropertiesViewProvider.instance = provider;
        return vscode.Disposable.from(
            vscode.window.registerWebviewViewProvider(PropertiesViewProvider.viewType, provider),
            provider,
        );
    }

    public dispose(): void {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        for (const d of this.disposables.splice(0)) {
            d.dispose();
        }
    }

    public resolveWebviewView(view: vscode.WebviewView): void {
        this.view = view;
        this.ready = false;
        const webview = view.webview;
        webview.options = { enableScripts: true, localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview')] };
        const version = String((this.context.extension.packageJSON as { version?: string }).version ?? '0');
        const asset = (file: string) => webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'out', 'webview', file)).toString() + `?v=${version}`;
        webview.html = buildPropertiesHtml(webview.cspSource, asset('properties.js'), asset('properties.css'), vscode.env.language);
        webview.onDidReceiveMessage((m: PropertiesToHost) => {
            void this.handle(m);
        }, null, this.disposables);
        view.onDidChangeVisibility(() => {
            if (view.visible) {
                this.schedule(0);
            }
        }, null, this.disposables);
        view.onDidDispose(() => {
            this.view = undefined;
            this.ready = false;
        }, null, this.disposables);
    }

    // -- state -------------------------------------------------------------------------------------

    private schedule(delay: number): void {
        if (this.timer) {
            clearTimeout(this.timer);
        }
        this.timer = setTimeout(() => {
            this.timer = undefined;
            void this.refresh();
        }, delay);
    }

    /** The editor the pane follows: the active visual editor, else the active DITA text editor. */
    private currentTarget(): Target | undefined {
        const visual = VisualEditorProvider.active;
        const input = vscode.window.tabGroups.activeTabGroup.activeTab?.input;
        if (visual && input instanceof vscode.TabInputCustom && input.uri.toString() === visual.document.uri.toString()) {
            return this.visualTarget();
        }
        const editor = vscode.window.activeTextEditor;
        return editor && isDitaDocument(editor.document) ? this.textTarget(editor) : undefined;
    }

    private visualTarget(): Target | undefined {
        const source = VisualEditorProvider.active;
        if (!source) {
            return undefined;
        }
        const selection = source.selection;
        const chain: ChainEntry[] = (selection?.chain ?? []).map((e) => ({
            name: e.name, xml: e.xml, editable: e.editable && !source.readOnly,
            reason: e.reason === 'formatting' ? this.labels.ui.formattingNoAttributes : source.readOnly ? this.labels.ui.readOnlyDocument : undefined,
        }));
        return {
            source: 'visual',
            document: source.document,
            grammar: source.grammar,
            chain,
            apply: async (index, xml) => {
                const entry = selection?.chain[index];
                if (!selection || !entry || entry.pos < 0) {
                    return this.labels.ui.formattingNoAttributes;
                }
                source.setAttributes(selection.stamp, entry.pos, entry.name, entry.xml, xml);
                return undefined;
            },
            idInUse: (index, id) => {
                const current = new Map(chain[index]?.xml ?? []).get('id');
                if (current === id) {
                    return false;
                }
                try {
                    const grammar = source.grammar;
                    return idConflict(parse(source.document.getText()).children, undefined, id, (n) => grammar?.elements[n]?.class);
                } catch {
                    return false;
                }
            },
        };
    }

    private parse(document: vscode.TextDocument): Parsed | undefined {
        const uri = document.uri.toString();
        if (this.parsed?.uri === uri && this.parsed.version === document.version) {
            return this.parsed;
        }
        let cst: Document;
        try {
            cst = parse(document.getText());
        } catch {
            this.parsed = undefined;
            return undefined;
        }
        const selected = sharedGrammarRegistry(this.context).select(cst, grammarSelectOptions(document));
        this.parsed = {
            uri, version: document.version, cst, index: new ElementIndex(cst), grammar: selected.grammar,
            classOf: selected.classOf, entity: selected.entity,
        };
        return this.parsed;
    }

    private textTarget(editor: vscode.TextEditor): Target {
        const document = editor.document;
        const readOnly = vscode.workspace.fs.isWritableFileSystem(document.uri.scheme) === false;
        const parsed = this.parse(document);
        if (!parsed) {
            return {
                source: 'text', document, grammar: undefined, chain: [], message: this.labels.ui.propertiesNotWellFormed,
                apply: async () => this.labels.ui.propertiesNotWellFormed, idInUse: () => false,
            };
        }
        const elements: ElementNode[] = parsed.index.chainAt(document.offsetAt(editor.selection.active))
            .map((id) => parsed.index.element(id))
            .filter((el): el is ElementNode => el !== undefined);
        const decode = (value: string) => decodeXmlText(value, parsed.entity);
        const chain: ChainEntry[] = elements.map((el) => ({
            name: el.name,
            xml: el.attrs.map((a) => [a.name, decode(a.value)] as [string, string]),
            editable: !readOnly,
            reason: readOnly ? this.labels.ui.readOnlyDocument : undefined,
        }));
        const version = document.version;
        return {
            source: 'text',
            document,
            grammar: parsed.grammar,
            chain,
            apply: async (index, xml) => {
                if (document.version !== version) {
                    return this.labels.ui.documentChanged;
                }
                const el = elements[index];
                const tag = rewriteOpenTag(parsed.cst.source, el, chain[index].xml, xml);
                const edit = new vscode.WorkspaceEdit();
                edit.replace(document.uri, new vscode.Range(document.positionAt(el.openTagRange.start), document.positionAt(el.openTagRange.end)), tag);
                return (await vscode.workspace.applyEdit(edit)) ? undefined : this.labels.ui.documentChanged;
            },
            idInUse: (index, id) => idConflict(parsed.cst.children, elements[index], id, parsed.classOf),
        };
    }

    /** Recompute what the pane shows (only while it is visible, unless `force`). */
    private async refresh(force = false): Promise<void> {
        if (!force && (!this.view || !this.ready || !this.view.visible)) {
            return;
        }
        const target = this.currentTarget();
        this.target = target;
        const ui = this.labels.ui;
        if (!target) {
            this.post({ type: 'state', state: { source: 'none', chain: [], selected: 0, fields: [], suggestions: {}, message: ui.propertiesEmpty, ui } });
            return;
        }
        // A different innermost element: show it (not the ancestor chosen before).
        const head = `${target.document.uri.toString()}|${target.chain.map((e) => e.name).join('/')}`;
        if (head !== this.head) {
            this.head = head;
            this.selected = target.chain.findIndex((e) => e.editable || e.reason !== ui.formattingNoAttributes);
            if (this.selected < 0) {
                this.selected = 0;
            }
        }
        this.selected = Math.min(this.selected, Math.max(0, target.chain.length - 1));
        const entry = target.chain[this.selected];
        const cls = entry ? target.grammar?.elements[entry.name]?.class : undefined;
        const state: PropertiesState = {
            source: target.source,
            fileName: path.basename(target.document.uri.fsPath),
            chain: target.chain.map((e) => ({ name: e.name, editable: e.editable, reason: e.reason })),
            selected: this.selected,
            element: entry ? { name: entry.name, cls, editable: entry.editable, reason: entry.reason } : undefined,
            fields: entry ? propertiesOf(target.grammar, entry.name, entry.xml) : [],
            suggestions: await this.schemeValues(target.document),
            message: target.message ?? (entry ? undefined : ui.propertiesEmpty),
            ui,
        };
        if (this.target === target) {
            this.post({ type: 'state', state });
        }
    }

    /** Controlled values of the document's subject scheme (via the language server), cached briefly. */
    private async schemeValues(document: vscode.TextDocument): Promise<Record<string, string[]>> {
        const key = document.uri.toString();
        const cached = this.schemes.get(key);
        if (cached && Date.now() - cached.at < SCHEME_TTL_MS) {
            return cached.values;
        }
        const values: Record<string, string[]> = {};
        const client = getLanguageClient();
        if (client && document.uri.scheme === 'file') {
            try {
                const response = await client.sendRequest<{ attributes: { attribute: string; values: { value: string }[] }[] }>(
                    'dita/getSubjectSchemeAttributes', { contextUri: client.code2ProtocolConverter.asUri(document.uri) });
                for (const a of response.attributes) {
                    values[a.attribute] = a.values.map((v) => v.value);
                }
            } catch (error) {
                logger.debug('Properties: subject scheme values unavailable', { error: String(error) });
            }
        }
        this.schemes.set(key, { at: Date.now(), values });
        return values;
    }

    private post(message: HostToProperties): void {
        if (message.type === 'state') {
            this.lastState = message.state;
        }
        if (this.view && this.ready) {
            void this.view.webview.postMessage(message);
        }
    }

    // -- messages ----------------------------------------------------------------------------------

    async handle(message: PropertiesToHost): Promise<void> {
        switch (message.type) {
            case 'ready':
                this.ready = true;
                await this.refresh();
                return;
            case 'select':
                this.selected = message.index;
                await this.refresh();
                return;
            case 'set':
                await this.set(message.index, message.element, message.name, message.value);
                return;
        }
    }

    /** Set (or remove) an attribute of the element shown; refuses invalid values and stale targets. */
    private async set(index: number, element: string, name: string, value: string | null): Promise<string | undefined> {
        // Re-read the element now: a change made just before (in the pane or the editor) is seen.
        const target = this.currentTarget();
        this.target = target;
        const entry = target?.chain[index];
        const fail = (text: string): string => {
            this.post({ type: 'error', name, message: text });
            return text;
        };
        if (!target || !entry || entry.name !== element) {
            this.schedule(0);
            return fail(this.labels.ui.documentChanged);
        }
        if (!entry.editable) {
            return fail(entry.reason ?? this.labels.ui.readOnly);
        }
        const field = propertiesOf(target.grammar, entry.name, entry.xml).find((f) => f.name === name);
        if (field && value !== null) {
            const problem = checkValue(field, value, (id) => target.idInUse(index, id));
            if (problem) {
                return fail(problem);
            }
        }
        if (field?.required && value === null) {
            return fail(`@${name} is required`);
        }
        const error = await target.apply(index, withAttribute(entry.xml, name, value));
        if (error) {
            this.schedule(0);
            return fail(error);
        }
        this.schedule(0);
        return undefined;
    }

    // -- tests -----------------------------------------------------------------------------------------

    /** What the pane shows (integration tests). */
    public static debugState(): PropertiesState | undefined {
        return PropertiesViewProvider.instance?.lastState;
    }

    /** Act as the pane would (integration tests): refresh now, or set an attribute. Resolves to an error, if any. */
    public static async debugAction(action: { type: 'refresh' } | { type: 'set'; index: number; element: string; name: string; value: string | null })
        : Promise<string | undefined> {
        const provider = PropertiesViewProvider.instance;
        if (!provider) {
            return 'no provider';
        }
        if (action.type === 'refresh') {
            await provider.refresh(true);
            return undefined;
        }
        return provider.set(action.index, action.element, action.name, action.value);
    }
}

function buildPropertiesHtml(cspSource: string, scriptUri: string, styleUri: string, lang: string): string {
    const nonce = crypto.randomBytes(16).toString('base64');
    const csp = [`default-src 'none'`, `style-src ${cspSource}`, `font-src ${cspSource}`, `script-src 'nonce-${nonce}'`].join('; ');
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    return `<!DOCTYPE html>
<html lang="${esc(lang)}">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="${esc(csp)}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="${esc(styleUri)}">
    <title>Properties</title>
</head>
<body>
    <div id="dc-properties" role="form" aria-live="polite"></div>
    <script nonce="${esc(nonce)}" src="${esc(scriptUri)}"></script>
</body>
</html>`;
}

/** "DITA: Show Properties": open the side bar on the pane. */
export function revealPropertiesView(): Thenable<unknown> {
    return vscode.commands.executeCommand(`${PropertiesViewProvider.viewType}.focus`);
}
