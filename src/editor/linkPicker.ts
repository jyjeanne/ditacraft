/**
 * The visual editor's link target picker (a QuickPick), and opening a link's target.
 *
 * Step one lists a web address, the elements of this topic, the keys of the topic's root map,
 * and the topics and maps of the workspace (or, outside a workspace, of the topic's folder);
 * choosing a topic opens step two: the topic itself or one of its elements. The items are
 * built by linkTargets.ts (no `vscode` there).
 */

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getGlobalKeySpaceResolver } from '../providers/ditaLinkProvider';
import { parse } from '../shared/cst/parse';
import { attr, findElementById, rootElement } from '../shared/cst/query';
import type { Document, ElementNode } from '../shared/cst/types';
import type { LinkTarget } from '../shared/editor/links';
import { classTokens } from '../shared/grammar/classTokens';
import { format } from '../shared/render/labels';
import { parseReference, resolvePath } from '../preview/resolver';
import { readWorkspaceText } from '../preview/workspaceText';
import { logger } from '../utils/logger';
import { hrefFor } from './imageFiles';
import { fileItems, fileSummary, pickItems, targetsInDocument, webLink, type FileTarget, type KeyTarget, type PickItem } from './linkTargets';

/** An answer given instead of a picker or an input box (integration tests). */
export interface DialogAnswer {
    file?: string;
    text?: string;
    pick?: string;
}

export interface LinkPickerContext {
    document: vscode.TextDocument;
    /** @class of an element name in the topic's grammar. */
    classOf: (name: string) => string | undefined;
    labels: Record<string, string>;
    nextAnswer: () => DialogAnswer | undefined;
    /** The root map whose keys are offered: the topic's map context (spec §13.8 M4); else the one found from the topic. */
    rootMap?: string;
}

/** Class tokens of the standard topic and map types, for files of other document types. */
const STANDARD: Record<string, string> = {
    topic: '- topic/topic ', concept: '- topic/topic concept/concept ', task: '- topic/topic task/task ',
    reference: '- topic/topic reference/reference ', glossentry: '- topic/topic concept/concept glossentry/glossentry ',
    glossgroup: '- topic/topic concept/concept glossgroup/glossgroup ', troubleshooting: '- topic/topic troubleshooting/troubleshooting ',
    title: '- topic/title ', map: '- map/map ', bookmap: '- map/map bookmap/bookmap ', subjectScheme: '- map/map subjectScheme/subjectScheme ',
};

function tokensFor(classOf: (name: string) => string | undefined): (el: ElementNode) => string[] {
    return (el) => classTokens(attr(el, 'class') ?? classOf(el.name) ?? STANDARD[el.name]);
}

/** Parsed files, by path, while unchanged. */
const parsed = new Map<string, { mtime: number; size: number; doc: Document | null }>();

async function load(file: string, context: vscode.Uri): Promise<Document | null> {
    let stat: fs.Stats;
    try {
        stat = await fs.promises.stat(file);
    } catch {
        return null;
    }
    const open = vscode.workspace.textDocuments.find((d) => d.uri.scheme === 'file' && d.isDirty && path.resolve(d.uri.fsPath) === path.resolve(file));
    const cached = parsed.get(file);
    if (!open && cached && cached.mtime === stat.mtimeMs && cached.size === stat.size) {
        return cached.doc;
    }
    const text = await readWorkspaceText(file, context);
    let doc: Document | null = null;
    try {
        doc = text === null ? null : parse(text);
    } catch {
        doc = null; // not well-formed: not offered
    }
    parsed.set(file, { mtime: stat.mtimeMs, size: stat.size, doc });
    return doc;
}

/** Topic and map files: the workspace's, or the topic's folder and those under it. */
async function candidateFiles(document: vscode.TextDocument): Promise<string[]> {
    if (vscode.workspace.getWorkspaceFolder(document.uri)) {
        const uris = await vscode.workspace.findFiles('**/*.{dita,ditamap,bookmap}', '**/{node_modules,.git,out,.vscode-test}/**', 5000);
        return uris.filter((u) => u.scheme === 'file').map((u) => u.fsPath);
    }
    const out: string[] = [];
    const scan = async (dir: string, depth: number): Promise<void> => {
        let entries: fs.Dirent[];
        try {
            entries = await fs.promises.readdir(dir, { withFileTypes: true });
        } catch {
            return;
        }
        for (const e of entries) {
            if (out.length >= 2000) {
                return;
            }
            const full = path.join(dir, e.name);
            if (e.isDirectory() && depth < 3 && !e.name.startsWith('.') && e.name !== 'node_modules') {
                await scan(full, depth + 1);
            } else if (e.isFile() && /\.(dita|ditamap|bookmap)$/i.test(e.name)) {
                out.push(full);
            }
        }
    };
    await scan(path.dirname(document.uri.fsPath), 0);
    return out;
}

async function fileTargets(ctx: LinkPickerContext): Promise<FileTarget[]> {
    const tokensOf = tokensFor(ctx.classOf);
    const files = await candidateFiles(ctx.document);
    const out: FileTarget[] = [];
    for (let i = 0; i < files.length; i += 32) {
        const batch = await Promise.all(files.slice(i, i + 32).map(async (file) => {
            const doc = await load(file, ctx.document.uri);
            const summary = doc ? fileSummary(doc, tokensOf) : null;
            return summary ? { path: file, ...summary } : undefined;
        }));
        out.push(...batch.filter((f): f is FileTarget => f !== undefined));
    }
    return out;
}

async function keyTargets(docPath: string, contextRoot?: string): Promise<KeyTarget[]> {
    try {
        const resolver = getGlobalKeySpaceResolver();
        const rootMap = contextRoot ?? await resolver.findRootMap(docPath);
        if (!rootMap) {
            return [];
        }
        const space = await resolver.buildKeySpace(rootMap);
        return [...space.keys.values()].map((def) => ({
            key: def.keyName,
            title: def.metadata?.navtitle ?? def.metadata?.keywords?.[0] ?? def.inlineContent?.trim() ?? undefined,
            targetFile: def.targetFile,
        }));
    } catch (error) {
        logger.debug('Link picker: no key space', error);
        return [];
    }
}

type QpItem = vscode.QuickPickItem & { item?: PickItem };

function toQuickPick(items: PickItem[]): QpItem[] {
    const out: QpItem[] = [];
    for (const item of items) {
        if (item.section) {
            out.push({ label: item.section, kind: vscode.QuickPickItemKind.Separator });
        }
        out.push({ label: item.label, description: item.description, detail: item.detail, item });
    }
    return out;
}

/**
 * Show `items` (loading more with `more`), resolve with the chosen one. `typed` turns what is
 * typed into an item of its own (a web address typed in the search box).
 */
async function choose(ctx: LinkPickerContext, title: string, placeholder: string, items: PickItem[], more?: Promise<PickItem[]>,
    typed?: (value: string) => PickItem | undefined): Promise<PickItem | undefined> {
    const answer = ctx.nextAnswer();
    if (answer) {
        const all = more ? await more : items;
        return all.find((i) => i.id === answer.pick) ?? (answer.text !== undefined ? typed?.(answer.text) : undefined);
    }
    const qp = vscode.window.createQuickPick<QpItem>();
    qp.title = title;
    qp.placeholder = placeholder;
    qp.matchOnDescription = true;
    let current = items;
    const render = (): void => {
        const extra = typed?.(qp.value);
        qp.items = [...(extra ? [{ label: extra.label, description: extra.description, alwaysShow: true, item: extra }] : []), ...toQuickPick(current)];
    };
    render();
    qp.busy = more !== undefined;
    qp.onDidChangeValue(render);
    qp.show();
    void more?.then((all) => {
        current = all;
        render();
        qp.busy = false;
    });
    const chosen = await new Promise<PickItem | undefined>((resolve) => {
        qp.onDidAccept(() => resolve(qp.selectedItems[0]?.item ?? typed?.(qp.value)));
        qp.onDidHide(() => resolve(undefined));
    });
    qp.dispose();
    return chosen;
}

async function askWebAddress(ctx: LinkPickerContext, value: string): Promise<LinkTarget | undefined> {
    const answer = ctx.nextAnswer();
    const address = answer ? answer.text : await vscode.window.showInputBox({
        prompt: ctx.labels.linkWebPrompt, value, placeHolder: 'https://', ignoreFocusOut: true,
        validateInput: (v) => (v.trim() === '' || webLink(v) ? undefined : ctx.labels.linkWebInvalid),
    });
    return address ? webLink(address) : undefined;
}

/**
 * Let the author choose a link target. `current`: the link's present target (shown in the title).
 * `map`: the target of a map's reference (spec §13.8) — keys, topics and maps chosen as a whole,
 * a web address; not the map's own elements.
 */
export async function pickLinkTarget(ctx: LinkPickerContext, current?: LinkTarget, mode?: 'map'): Promise<LinkTarget | undefined> {
    const docPath = ctx.document.uri.fsPath;
    const tokensOf = tokensFor(ctx.classOf);
    const map = mode === 'map';
    const labels = { web: ctx.labels.linkWeb, thisTopic: ctx.labels.linkThisTopic, keys: ctx.labels.linkKeys, topics: ctx.labels.linkTopics };
    let here: ReturnType<typeof targetsInDocument> = [];
    try {
        here = map ? [] : targetsInDocument(parse(ctx.document.getText()), tokensOf);
    } catch {
        // Not well-formed now: no elements of this topic.
    }
    const now = current?.href ?? (current?.keyref ? `[${current.keyref}]` : undefined);
    const pickTitle = map ? ctx.labels.mapPickTitle : ctx.labels.linkPickTitle;
    const title = now ? `${pickTitle} — ${now}` : pickTitle;
    const placeholder = map ? ctx.labels.mapPlaceholder : ctx.labels.linkPlaceholder;
    const first = pickItems(docPath, here, [], [], labels, map);
    const all = Promise.all([keyTargets(docPath, ctx.rootMap), fileTargets(ctx)]).then(([keys, files]) => ({ keys, files }));
    const typedAddress = (value: string): PickItem | undefined => {
        const target = webLink(value);
        return target ? { id: 'typed', label: `$(globe) ${value.trim()}`, description: ctx.labels.linkWeb.replace(/…$/, ''), target } : undefined;
    };
    const chosen = await choose(ctx, title, placeholder, first, all.then(({ keys, files }) => pickItems(docPath, here, keys, files, labels, map)), typedAddress);
    if (!chosen) {
        return undefined;
    }
    if (chosen.id === 'web') {
        return askWebAddress(ctx, current?.scope === 'external' ? current.href ?? '' : '');
    }
    if (chosen.target) {
        return chosen.target;
    }
    // A topic file: the topic itself, or one of its elements.
    const { files } = await all;
    const file = files.find((f) => `file:${hrefFor(docPath, f.path)}` === chosen.id);
    if (!file) {
        return undefined;
    }
    const doc = await load(file.path, ctx.document.uri);
    const targets = doc ? targetsInDocument(doc, tokensOf) : [];
    const items = fileItems(docPath, file, targets, ctx.labels.linkTopicItself);
    const element = await choose(ctx, format(ctx.labels.linkStepTwo, file.title || path.basename(file.path)), ctx.labels.linkPlaceholder, items);
    return element?.target;
}

/** Open what a link points to: a web page, or the file at the element (keys resolved). Returns what was not found, if anything. */
export async function openLinkTarget(document: vscode.TextDocument, target: LinkTarget): Promise<string | undefined> {
    const docPath = document.uri.fsPath;
    let file: string | undefined;
    let topicId: string | undefined;
    let elemId: string | undefined;
    if (target.keyref) {
        const [key, sub] = target.keyref.split('/');
        const def = await getGlobalKeySpaceResolver().resolveKey(key, docPath);
        if (!def?.targetFile) {
            return target.keyref;
        }
        file = def.targetFile;
        topicId = def.elementId;
        elemId = sub || undefined;
    } else if (target.href) {
        if (target.scope === 'external' || /^[a-z][\w+.-]+:/i.test(target.href) && !/^file:/i.test(target.href)) {
            await vscode.env.openExternal(vscode.Uri.parse(target.href));
            return undefined;
        }
        const ref = parseReference(target.href);
        file = ref.file ? resolvePath(docPath, ref.file) : docPath;
        topicId = ref.topicId === '.' ? undefined : ref.topicId;
        elemId = ref.elemId;
    }
    if (!file || !fs.existsSync(file)) {
        return target.href ?? target.keyref ?? '';
    }
    if (!/\.(dita|ditamap|bookmap|xml)$/i.test(file)) {
        // Another format (a PDF, an image, a page): VS Code's editor for it.
        await vscode.commands.executeCommand('vscode.open', vscode.Uri.file(file), vscode.ViewColumn.Beside);
        return undefined;
    }
    const text = await vscode.workspace.openTextDocument(vscode.Uri.file(file));
    let offset = 0;
    try {
        const doc = parse(text.getText());
        const scope = topicId ? findElementById(doc.children, topicId) : rootElement(doc);
        const el = elemId && scope ? findElementById(scope.children, elemId) : scope;
        offset = el?.range.start ?? 0;
    } catch {
        // Not well-formed: open at the start.
    }
    const position = text.positionAt(offset);
    await vscode.window.showTextDocument(text, { viewColumn: vscode.ViewColumn.Beside, selection: new vscode.Range(position, position) });
    return undefined;
}
