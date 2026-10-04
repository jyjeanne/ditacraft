/**
 * Map contexts of topics (spec §13.8, M4): the place (./mapContext.ts) through which the visual
 * preview and the visual editor show a topic — the one chosen by the author (**DITA: Choose Map
 * Context**, or opening the topic from a map row), else the first place found, the project's root
 * map (`ditacraft.rootMap`) first. Choices are kept per topic in the workspace state.
 *
 * A topic's keys resolve in its place's root map, in the key scope of its reference; the place
 * also gives the navigation above the topic and the metadata the map passes down to it.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getGlobalKeySpaceResolver } from '../providers/ditaLinkProvider';
import { parse } from '../shared/cst/parse';
import { attr } from '../shared/cst/query';
import type { Document, ElementNode } from '../shared/cst/types';
import { classTokens } from '../shared/grammar/classTokens';
import { labelsFor } from '../shared/render/labels';
import type { KeyDefinitionLike } from './resolver';
import { findPlaces, occurrenceAt, placeLabel, samePlace, type MapPlace } from './mapContext';
import { sharedGrammarRegistry } from './sharedRegistry';
import { readWorkspaceText } from './workspaceText';

const STATE_KEY = 'ditacraft.mapContexts';

/** A topic's context: its place (none when no map references it, or when the author chose none), and how it was decided. */
export interface TopicContext {
    place?: MapPlace;
    /** The author chose it (a place, or none); otherwise it is the first place found. */
    chosen: boolean;
    /** How many places the maps of the workspace have for the topic. */
    count: number;
}

type Stored = Record<string, { root: string; maps: string[]; occurrence: number } | 'none'>;

/** Map class tokens of the standard elements, for maps whose grammar is not known. */
const STANDARD: Record<string, string> = {
    map: '- map/map ', bookmap: '- map/map bookmap/bookmap ', topicref: '- map/topicref ', title: '- topic/title ', topicmeta: '- map/topicmeta ',
    navtitle: '- topic/navtitle ', keydef: '+ map/topicref mapgroup-d/keydef ', mapref: '+ map/topicref mapgroup-d/mapref ',
    topichead: '+ map/topicref mapgroup-d/topichead ', topicgroup: '+ map/topicref mapgroup-d/topicgroup ',
};

export class MapContexts implements vscode.Disposable {
    private static instance: MapContexts | undefined;
    private readonly changed = new vscode.EventEmitter<string | undefined>();
    /** A topic's context changed (its path), or every topic's (undefined: the maps changed). */
    readonly onDidChange = this.changed.event;
    private readonly disposables: vscode.Disposable[] = [this.changed];
    /** The parsed maps, by where they were looked for (the workspace, or a folder outside it). */
    private maps = new Map<string, Promise<Map<string, Document>>>();
    private readonly classOf = new WeakMap<ElementNode, (name: string) => string | undefined>();
    private mapsChangedTimer: ReturnType<typeof setTimeout> | undefined;

    static initialize(context: vscode.ExtensionContext): MapContexts {
        if (!MapContexts.instance) {
            MapContexts.instance = new MapContexts(context);
            context.subscriptions.push(MapContexts.instance);
        }
        return MapContexts.instance;
    }

    static get(): MapContexts | undefined {
        return MapContexts.instance;
    }

    private constructor(private readonly context: vscode.ExtensionContext) {
        const watcher = vscode.workspace.createFileSystemWatcher('**/*.{ditamap,bookmap}');
        const mapsChanged = (): void => {
            this.maps.clear();
            if (this.mapsChangedTimer) {
                clearTimeout(this.mapsChangedTimer);
            }
            this.mapsChangedTimer = setTimeout(() => this.changed.fire(undefined), 400);
        };
        this.disposables.push(
            watcher, watcher.onDidChange(mapsChanged), watcher.onDidCreate(mapsChanged), watcher.onDidDelete(mapsChanged),
            // A map edited in an editor (unsaved): its references and metadata change.
            vscode.workspace.onDidChangeTextDocument((e) => {
                if (e.contentChanges.length > 0 && /\.(ditamap|bookmap)$/i.test(e.document.uri.fsPath)) {
                    mapsChanged();
                }
            }),
        );
    }

    dispose(): void {
        if (this.mapsChangedTimer) {
            clearTimeout(this.mapsChangedTimer);
        }
        for (const d of this.disposables.splice(0)) {
            d.dispose();
        }
        if (MapContexts.instance === this) {
            MapContexts.instance = undefined;
        }
    }

    // -- the maps -------------------------------------------------------------------------------

    /**
     * The maps that may reference a topic, parsed (an open editor's text wins; malformed ones left
     * out): the workspace's, or — for a topic outside the workspace — those in its folder and the
     * folders under it, and in the two folders above it.
     */
    private loadMaps(topicPath: string): Promise<Map<string, Document>> {
        const inWorkspace = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(topicPath)) !== undefined;
        const where = inWorkspace ? '' : path.dirname(path.resolve(topicPath));
        let loaded = this.maps.get(where);
        if (loaded) {
            return loaded;
        }
        loaded = (async () => {
            const out = new Map<string, Document>();
            const uris = inWorkspace
                ? await vscode.workspace.findFiles('**/*.{ditamap,bookmap}', '**/{node_modules,.git,out,.vscode-test}/**', 2000)
                : localMaps(where).map((file) => vscode.Uri.file(file));
            const registry = sharedGrammarRegistry(this.context);
            await Promise.all(uris.filter((u) => u.scheme === 'file').map(async (uri) => {
                const text = await readWorkspaceText(uri.fsPath, uri);
                if (text === null) {
                    return;
                }
                try {
                    const doc = parse(text);
                    const root = doc.children.find((c): c is ElementNode => c.type === 'element');
                    if (root) {
                        this.classOf.set(root, registry.select(doc).classOf);
                    }
                    out.set(uri.fsPath, doc);
                } catch {
                    // Not well-formed now: left out until it is.
                }
            }));
            return out;
        })();
        this.maps.set(where, loaded);
        return loaded;
    }

    private readonly tokensOf = (el: ElementNode): string[] => {
        let root: ElementNode = el;
        while (root.parent) {
            root = root.parent;
        }
        const cls = attr(el, 'class') ?? this.classOf.get(root)?.(el.name) ?? STANDARD[el.name];
        return cls ? classTokens(cls) : [];
    };

    private preferredRoot(): string | undefined {
        const setting = vscode.workspace.getConfiguration('ditacraft').get<string>('rootMap', '');
        const folder = vscode.workspace.workspaceFolders?.[0];
        if (!setting) {
            return undefined;
        }
        return path.isAbsolute(setting) ? setting : folder ? path.join(folder.uri.fsPath, setting) : undefined;
    }

    /** The places where the maps of the workspace reference a topic. */
    async places(topicPath: string): Promise<MapPlace[]> {
        return findPlaces(topicPath, await this.loadMaps(topicPath), this.tokensOf, this.preferredRoot());
    }

    // -- a topic's context ----------------------------------------------------------------------

    private stored(): Stored {
        return this.context.workspaceState.get<Stored>(STATE_KEY, {});
    }

    private keyOf(topicPath: string): string {
        const resolved = path.resolve(topicPath);
        return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
    }

    /** The context a topic is shown in. */
    async contextOf(topicPath: string): Promise<TopicContext> {
        const places = await this.places(topicPath);
        const choice = this.stored()[this.keyOf(topicPath)];
        if (choice === 'none') {
            return { chosen: true, count: places.length };
        }
        const chosen = choice ? samePlace(places, choice) : undefined;
        return chosen ? { place: chosen, chosen: true, count: places.length } : { place: places[0], chosen: false, count: places.length };
    }

    /** Show a topic in a place (`null`: in no map; `undefined`: the first place found again). */
    async choose(topicPath: string, place: MapPlace | null | undefined): Promise<void> {
        const stored = { ...this.stored() };
        const key = this.keyOf(topicPath);
        if (place === undefined) {
            delete stored[key];
        } else {
            stored[key] = place === null ? 'none' : { root: place.root, maps: place.maps, occurrence: place.occurrence };
        }
        await this.context.workspaceState.update(STATE_KEY, stored);
        this.changed.fire(path.resolve(topicPath));
    }

    /**
     * The topic opened from a map row (the reference starting at `offset` in the map's text): the
     * topic is shown in that place from now on.
     */
    async chooseFromMapRow(topicPath: string, mapPath: string, mapText: string, offset: number): Promise<void> {
        let doc: Document;
        try {
            doc = parse(mapText);
        } catch {
            return;
        }
        const root = doc.children.find((c): c is ElementNode => c.type === 'element');
        if (root) {
            this.classOf.set(root, sharedGrammarRegistry(this.context).select(doc).classOf);
        }
        const occurrence = occurrenceAt(doc, mapPath, topicPath, offset, this.tokensOf);
        if (occurrence === undefined) {
            return;
        }
        const same = (a: string, b: string) => this.keyOf(a) === this.keyOf(b);
        const place = (await this.places(topicPath)).find((p) => same(p.maps[p.maps.length - 1], mapPath) && p.occurrence === occurrence);
        if (place) {
            await this.choose(topicPath, place);
        }
    }

    /** Let the author choose the place a topic is shown in (QuickPick). */
    async pick(topicPath: string): Promise<void> {
        const ui = labelsFor(vscode.env.language).ui;
        const places = await this.places(topicPath);
        const current = await this.contextOf(topicPath);
        type Item = vscode.QuickPickItem & { place?: MapPlace | null };
        const items: Item[] = [
            { label: `$(sync) ${ui.contextAutomatic}`, description: places[0] ? placeLabel(places[0]) : ui.contextNone, place: undefined },
            ...places.map((p): Item => ({
                label: `$(list-tree) ${placeLabel(p)}`,
                description: [path.basename(p.root), ...p.maps.slice(1).map((m) => path.basename(m))].join(' › ')
                    + (p.occurrence > 0 ? ` (${p.occurrence + 1})` : ''),
                detail: p.info.scope ? `keyscope ${p.info.scope}` : undefined,
                picked: current.chosen && current.place === p,
                place: p,
            })),
            { label: `$(circle-slash) ${ui.contextNone}`, description: ui.contextNoneDetail, place: null },
        ];
        const answer = MapContexts.nextAnswer?.();
        const chosen = answer !== undefined
            ? items[answer]
            : await vscode.window.showQuickPick(items, { title: `${ui.contextPickTitle} — ${path.basename(topicPath)}`, placeHolder: places.length === 0 ? ui.contextNoPlace : undefined });
        if (chosen) {
            await this.choose(topicPath, chosen.place);
        }
    }

    /** Integration tests: the index of the next pick's item, instead of the QuickPick. */
    static nextAnswer: (() => number | undefined) | undefined;

    // -- keys ---------------------------------------------------------------------------------------

    /**
     * Resolve a key for a topic shown in its context: in the place's root map, in the scope of its
     * reference (also for references in content the topic reuses from `file`); without a place (no
     * map references the topic, or the author chose none), as elsewhere in DitaCraft (the root map
     * found from `file`).
     */
    async resolveKey(key: string, file: string, context: TopicContext | undefined): Promise<KeyDefinitionLike | null> {
        const resolver = getGlobalKeySpaceResolver();
        const place = context?.place;
        if (!place || !fs.existsSync(place.root)) {
            return resolver.resolveKey(key, file);
        }
        return resolver.resolveKeyInMap(key, place.root, file, place.info.scope);
    }
}

/** The maps in `folder` and the folders under it (three levels), and in the two folders above it. */
function localMaps(folder: string): string[] {
    const out: string[] = [];
    const isMap = (name: string) => /\.(ditamap|bookmap)$/i.test(name);
    const scan = (dir: string, depth: number): void => {
        let entries: fs.Dirent[];
        try {
            entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
            return;
        }
        for (const e of entries) {
            if (out.length >= 500) {
                return;
            }
            if (e.isFile() && isMap(e.name)) {
                out.push(path.join(dir, e.name));
            } else if (e.isDirectory() && depth > 0 && !e.name.startsWith('.') && e.name !== 'node_modules') {
                scan(path.join(dir, e.name), depth - 1);
            }
        }
    };
    scan(folder, 3);
    for (let up = path.dirname(folder), k = 0; k < 2 && up !== path.dirname(up); up = path.dirname(up), k++) {
        scan(up, 0);
    }
    return out;
}
