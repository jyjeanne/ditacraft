/**
 * Server-side Key Space Service.
 * Resolves DITA key references by building a key space from map hierarchies.
 * Ported from client-side src/utils/keySpaceResolver.ts with VS Code
 * dependencies replaced by injected callbacks.
 */

import * as path from 'path';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';

import { XMLParser } from 'fast-xml-parser';
import { TAG_ATTRS } from '../utils/patterns';
import {
    stripCommentsAndCDATA, isPathWithinWorkspace, findContainingWorkspaceFolder, normalizeFsPath, scanKeyDefinitions,
} from '../utils/textUtils';
import { IKeySpaceService } from './interfaces';

// --- Interfaces ---

export interface KeyDefinition {
    keyName: string;
    targetFile?: string;
    /** The key's resource when it is a web address (`http://`, `https://`), not a file. */
    externalHref?: string;
    elementId?: string;
    inlineContent?: string;
    sourceMap: string;
    /** 1-based line number of the key name within sourceMap. */
    sourceLine?: number;
    scope?: string;
    processingRole?: string;
    /** Indirect key reference: when set, resolution follows the chain to this key name. */
    keyref?: string;
    metadata?: KeyMetadata;
    /**
     * Defined by a `<subjectdef>` of a subject scheme: a controlled value (a subject
     * category or value), which has no target by design.
     */
    subject?: boolean;
}

export interface KeyMetadata {
    navtitle?: string;
    keywords?: string[];
    shortdesc?: string;
}

/** One lookup step recorded during key resolution explain mode. */
export interface ResolutionStep {
    /** The type of lookup attempted. */
    type: 'context-scope-lookup' | 'unqualified-lookup' | 'peer-map-lookup' | 'keyref-hop';
    /** The exact key name that was looked up at this step. */
    attempted: string;
    /** Whether this step produced a match. */
    found: boolean;
    /** The definition matched at this step (undefined when not found). */
    definition?: KeyDefinition;
    /** Human-readable explanation of what happened and why. */
    note: string;
}

/** Detailed report produced by explainKey(). */
export interface KeyResolutionReport {
    keyName: string;
    contextFilePath: string;
    /** Scope prefix of the context file (e.g. "product.lib"), if any. */
    contextScope?: string;
    /** The winning definition, or null when the key is not found. */
    resolvedDefinition: KeyDefinition | null;
    /** Ordered list of lookup steps, including failed attempts. */
    steps: ResolutionStep[];
    /**
     * Key names traversed by following @keyref chains, in hop order.
     * ["alias", "real"] means alias @keyref→ real (no further chain).
     * Empty when no keyref chain was followed.
     */
    keyrefChain: string[];
}

export interface KeySpace {
    rootMap: string;
    keys: Map<string, KeyDefinition>;
    buildTime: number;
    mapHierarchy: string[];
    /** Paths to subject scheme maps discovered during BFS traversal. */
    subjectSchemePaths: string[];
    /** Keys defined more than once. Maps key name → all definitions (including the effective first one). */
    duplicateKeys: Map<string, KeyDefinition[]>;
    /**
     * Maps each topic file path (normalised) to its primary scope prefix.
     * Used by resolveKey() to resolve a key reference in the key scope of the
     * topic that makes it.
     */
    topicToScope: Map<string, string>;
    /**
     * Maps each map of the key space (normalised path) to the key scope its content
     * belongs to, so that key references written in a submap resolve in its scope.
     * Kept apart from topicToScope, whose topics drive root map discovery.
     */
    mapToScope?: Map<string, string>;
    /**
     * Peer maps encountered during BFS that are NOT inlined into this key space.
     * Maps keyscope-name → absolute map path.  Populated for maprefs with
     * @scope="peer" + @keyscope; loaded lazily in resolveKey() on cache miss.
     */
    deferredPeerMaps: Map<string, string>;
    /**
     * Set to true when the number of qualified scope aliases exceeded
     * MAX_KEY_SPACE_ENTRIES.  Additional aliases were silently dropped.
     */
    scopeExplosionWarning?: boolean;
}

interface CacheConfig {
    ttlMs: number;
    maxSize: number;
}

/** What a key space's maps reference, for root map discovery (normalized paths). */
interface ReferencedFiles {
    /** The topics and maps referenced (topicrefs, key definition targets, submaps). */
    files: Set<string>;
    /** The folders of the referenced topics, and every folder above them. */
    folders: Set<string>;
    /** The submaps and peer maps used, the root map left out. */
    maps: Set<string>;
}

export interface KeySpaceSettings {
    keySpaceCacheTtlMinutes: number;
    maxLinkMatches: number;
}

// --- Constants ---

const ONE_MINUTE_MS = 60_000;
const MAX_KEY_SPACES = 10;
const MAX_MAP_REFERENCES = 1000;
const MAX_INLINE_SCOPE_DEPTH = 10;
/** Cap on total qualified scope-alias entries to guard against combinatorial explosion. */
const MAX_KEY_SPACE_ENTRIES = 50_000;
const ROOT_MAP_CACHE_TTL_MS = ONE_MINUTE_MS;
/**
 * How many candidate maps findRootMap checks for a reference to the file
 * (each costs a key space build). Below MAX_KEY_SPACES so that the
 * candidates of one directory stay cached together.
 */
const MAX_ROOT_MAP_CANDIDATES = 8;

/**
 * How many directory levels findRootMap scans upward for files that live
 * outside every workspace folder (the file's own directory counts as 1).
 * Keeps nearby-map discovery for loose files without ever scanning $HOME
 * or the filesystem root.
 */
const OUTSIDE_WORKSPACE_MAX_WALK_LEVELS = 3;
const FILE_WATCHER_DEBOUNCE_MS = 300;

/**
 * The text of an element parsed by fast-xml-parser, its descendants' text
 * included (attributes left out), whitespace collapsed.
 */
function nodeText(node: unknown): string {
    const collect = (n: unknown): string => {
        if (typeof n === 'string' || typeof n === 'number' || typeof n === 'boolean') return String(n);
        if (Array.isArray(n)) return n.map(collect).join(' ');
        if (n && typeof n === 'object') {
            return Object.entries(n as Record<string, unknown>)
                .filter(([name]) => !name.startsWith('@_'))
                .map(([, child]) => collect(child))
                .join(' ');
        }
        return '';
    };
    return collect(node).replace(/\s+/g, ' ').trim();
}

/** A key's href that names a web resource rather than a file. */
/** A start tag with @keys: element name (without prefix), offset, key names and their offsets. */
interface KeyDefinitionTag {
    elementName: string;
    elementOffset: number;
    keyNames: string[];
    offsets: number[];
}

/** `content` with everything outside [start, end) blanked, line breaks kept. */
function blankOutside(content: string, start: number, end: number): string {
    const blank = (text: string) => text.replace(/[^\r\n]/g, ' ');
    return blank(content.slice(0, start)) + content.slice(start, end) + blank(content.slice(end));
}

/** The start tags with @keys of a map's text, in document order. */
function keyDefinitionTags(content: string): KeyDefinitionTag[] {
    const tags: KeyDefinitionTag[] = [];
    for (const token of scanKeyDefinitions(content)) {
        const last = tags[tags.length - 1];
        if (last && last.elementOffset === token.elementOffset) {
            last.keyNames.push(token.keyName);
            last.offsets.push(token.offset);
        } else {
            tags.push({
                elementName: token.elementName.replace(/^\w+:/, ''),
                elementOffset: token.elementOffset,
                keyNames: [token.keyName],
                offsets: [token.offset],
            });
        }
    }
    return tags;
}

function isWebAddress(href: string): boolean {
    return href.startsWith('http://') || href.startsWith('https://');
}

/** How a key definition's resource is shown in reports: its file, web address or text. */
function describeKeyTarget(def: KeyDefinition): string {
    if (def.targetFile) return path.basename(def.targetFile);
    if (def.externalHref) return def.externalHref;
    return def.inlineContent ? `"${def.inlineContent}"` : '(no target)';
}
const MIN_CLEANUP_INTERVAL_MS = 5 * ONE_MINUTE_MS;
const CACHE_CLEANUP_RATIO = 3;

// --- Service ---

export class KeySpaceService implements IKeySpaceService {
    private workspaceFolders: string[];
    private getSettings: () => Promise<KeySpaceSettings>;
    private log: (msg: string) => void;

    /** Shared XMLParser instance — stateless, safe to reuse across all calls. */
    private readonly xmlParser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        parseAttributeValue: false,
        parseTagValue: false,
        allowBooleanAttributes: true,
    });
    /** The same, keeping the elements in document order (the shared parser groups same-name siblings). */
    private readonly orderedXmlParser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        parseAttributeValue: false,
        parseTagValue: false,
        allowBooleanAttributes: true,
        preserveOrder: true,
    });

    private keySpaceCache: Map<string, KeySpace> = new Map();
    /** The root map chosen for a file, keyed by the file's normalized path. */
    private rootMapCache: Map<string, { rootMap: string | null; timestamp: number }> = new Map();
    /** The candidate root maps of a directory (findRootMap's upward walk),
     *  keyed by the directory. */
    private rootMapCandidatesCache: Map<string, { candidates: string[]; timestamp: number }> = new Map();
    /** The files each key space's maps reference, and the folders of its topics. */
    private referencedFilesCache = new WeakMap<KeySpace, ReferencedFiles>();
    private cacheConfig: CacheConfig;
    private pendingBuilds: Map<string, Promise<KeySpace>> = new Map();
    /** In-flight dedup for the upward walk behind findRootMap(), mirroring
     *  pendingBuilds above — keyed by the queried file's containing directory,
     *  since concurrent resolveKey() calls for files in the same directory would
     *  otherwise each fire their own redundant upward-directory walk on a
     *  cold cache (e.g. every keyref usage of a heavily-referenced key,
     *  resolved concurrently by rename/find-references). */
    private pendingRootMapLookups: Map<string, Promise<string[]>> = new Map();
    /** Bumped on structural invalidations (workspace/root-map/path changes);
     *  in-flight builds and root-map lookups that started under an older
     *  generation drop their cache write so stale data can't resurrect. */
    private cacheGeneration = 0;
    /** Bumped on every invalidation, content edits included: a map edit can
     *  add or remove the reference that decides a file's root map, so a choice
     *  made while it ran is not cached. */
    private rootMapChoiceGeneration = 0;
    /** Files invalidated while builds are in flight. Each build captures the
     *  log length at start; on completion it drops its cache write only if a
     *  logged file is in ITS map hierarchy — so unrelated builds keep caching. */
    private invalidationLog: string[] = [];
    /** Count of builds currently executing (owners of pendingBuilds entries). */
    private inFlightBuilds = 0;
    private debounceTimer: ReturnType<typeof setTimeout> | undefined;
    /** changed file → pathChanged (true when created/deleted/renamed). */
    private pendingInvalidations: Map<string, boolean> = new Map();
    private cleanupTimer: ReturnType<typeof setInterval> | undefined;

    /** Explicitly set root map path (overrides auto-discovery). */
    private explicitRootMapPath: string | null = null;

    constructor(
        workspaceFolders: string[],
        getSettings: () => Promise<KeySpaceSettings>,
        log: (msg: string) => void
    ) {
        this.workspaceFolders = workspaceFolders;
        this.getSettings = getSettings;
        this.log = log;

        // Load initial cache config synchronously with defaults
        this.cacheConfig = {
            ttlMs: 5 * ONE_MINUTE_MS,
            maxSize: MAX_KEY_SPACES,
        };

        // Async reload from actual settings
        this.reloadCacheConfig();

        // Periodic cleanup
        this.startPeriodicCleanup();
    }

    // --- Public API ---

    /** Get the current workspace folder paths. */
    public getWorkspaceFolders(): readonly string[] {
        return this.workspaceFolders;
    }

    /**
     * Set an explicit root map path: the root map of every file it references,
     * and of the files no map references (see findRootMap).
     * Pass null to revert to auto-discovery.
     */
    public setExplicitRootMap(rootMapPath: string | null): void {
        this.explicitRootMapPath = rootMapPath;
        // Full invalidation so findRootMap uses the new explicit path
        // and key space is rebuilt from the new root map
        this.invalidateAllCaches();
    }

    /**
     * Structural invalidation: bump the generation and clear every cache, so
     * in-flight builds and root-map lookups can't write stale results back,
     * and new callers can't join pre-invalidation builds.
     */
    private invalidateAllCaches(): void {
        this.cacheGeneration++;
        this.rootMapChoiceGeneration++;
        this.keySpaceCache.clear();
        this.rootMapCache.clear();
        this.rootMapCandidatesCache.clear();
        this.pendingBuilds.clear();
        this.pendingRootMapLookups.clear();
    }

    /** Get the current explicit root map path (null if auto-discovering). */
    public getExplicitRootMap(): string | null {
        return this.explicitRootMapPath;
    }

    /**
     * Resolve a key name to its definition, following any `@keyref` indirection
     * chain the matched entry carries to its ultimate target.
     * Finds the root map, builds (or retrieves cached) key space, then looks up key.
     */
    public async resolveKey(
        keyName: string,
        contextFilePath: string
    ): Promise<KeyDefinition | null> {
        const found = await this.resolveKeyEntryWithScope(keyName, contextFilePath);
        if (!found) return null;
        return this.followKeyrefChain(found.def, found.keys, found.scopePrefix);
    }

    /**
     * Resolve a key name to its own raw definition, WITHOUT following any
     * `@keyref` indirection chain that definition itself carries.
     *
     * Use this instead of `resolveKey()` when the caller needs to know which
     * specific `keys="..."` entry a name refers to — e.g. verifying a rename
     * candidate actually names the definition being renamed — rather than the
     * content that name ultimately resolves to. `resolveKey()` is right for
     * every other caller (hover, navigation, preview) that wants the resolved
     * target; this exists because `resolveKey('alias', ...)` on an indirect
     * key (`<keydef keys="alias" keyref="target"/>`) returns `target`'s
     * definition, not `alias`'s own — the wrong identity to compare `alias`
     * itself against.
     */
    public async resolveKeyEntry(
        keyName: string,
        contextFilePath: string
    ): Promise<KeyDefinition | null> {
        const found = await this.resolveKeyEntryWithScope(keyName, contextFilePath);
        return found?.def ?? null;
    }

    /**
     * Shared scope-aware lookup behind both `resolveKey()` and
     * `resolveKeyEntry()` — everything `resolveKey()` used to do itself,
     * except the final `followKeyrefChain()` call, which callers apply (or
     * don't) themselves.
     */
    private async resolveKeyEntryWithScope(
        keyName: string,
        contextFilePath: string
    ): Promise<{ def: KeyDefinition; keys: Map<string, KeyDefinition>; scopePrefix: string } | null> {
        const rootMap = await this.findRootMap(contextFilePath);
        if (!rootMap) {
            return null;
        }

        const keySpace = await this.buildKeySpace(rootMap);

        // Resolved in the key scope of the file that makes the reference: the
        // enclosing scopes take precedence (see lookupKey).
        const found = KeySpaceService.lookupKey(keySpace.keys, keyName, this.contextScope(keySpace, contextFilePath));
        if (found) {
            return { def: found.def, keys: keySpace.keys, scopePrefix: found.scopePrefix };
        }

        // Gap 4 — deferred peer map resolution.
        // Keys in peer maps are accessed as "peerScopeName.actualKey".
        // Strip the first scope segment and look up the remainder in the peer map's key space.
        const dotIdx = keyName.indexOf('.');
        if (dotIdx > 0 && keySpace.deferredPeerMaps.size > 0) {
            const peerScopeName = keyName.slice(0, dotIdx);
            const peerKey = keyName.slice(dotIdx + 1);
            const peerMapPath = keySpace.deferredPeerMaps.get(peerScopeName);
            if (peerMapPath) {
                try {
                    const peerKeySpace = await this.buildKeySpace(peerMapPath);
                    const peerDef = peerKeySpace.keys.get(peerKey) ?? null;
                    if (peerDef) {
                        // Derive the scope prefix from peerKey so that keyref chains
                        // within a named scope of the peer map resolve correctly.
                        // e.g. peerKey="inner.realKey" → peerKeyScope="inner"
                        const lastDot = peerKey.lastIndexOf('.');
                        const peerKeyScope = lastDot > 0 ? peerKey.slice(0, lastDot) : '';
                        return { def: peerDef, keys: peerKeySpace.keys, scopePrefix: peerKeyScope };
                    }
                } catch {
                    // peer map not readable — fall through to null
                }
            }
        }

        return null;
    }

    /**
     * The key scope of a file of the key space: the scope of the topicref that
     * references a topic, or the scope a submap belongs to ('' for the root scope).
     */
    private contextScope(keySpace: KeySpace, contextFilePath: string): string {
        const normalized = normalizeFsPath(contextFilePath);
        return keySpace.topicToScope.get(normalized) ?? keySpace.mapToScope?.get(normalized) ?? '';
    }

    /**
     * The scopes in which a key name is looked up from a key scope, in order of
     * precedence: the root scope first, then each scope down to the referencing one.
     * DITA 1.3 §2.3.4.1: "When a key has a definition in the key space that is
     * inherited from a parent scope, that definition is effective"; §2.3.4.4: "a key
     * definition in a parent scope overrides all definitions for the same key name in
     * all descendant scopes." A name qualified relative to an enclosing scope ("A-1.c"
     * from scope "A.A-2") is found the same way. Keys of child scopes are reachable only
     * by their scope-qualified names, which the root scope holds.
     */
    private static scopeLookupOrder(scopePrefix: string): string[] {
        const segments = scopePrefix ? scopePrefix.split('.') : [];
        return Array.from({ length: segments.length + 1 }, (_, depth) => segments.slice(0, depth).join('.'));
    }

    /** The effective definition of a key referenced from a key scope, and the scope it was found in. */
    private static lookupKey(
        keys: Map<string, KeyDefinition>,
        keyName: string,
        scopePrefix: string
    ): { def: KeyDefinition; scopePrefix: string } | null {
        for (const prefix of KeySpaceService.scopeLookupOrder(scopePrefix)) {
            const def = keys.get(prefix ? `${prefix}.${keyName}` : keyName);
            if (def) return { def, scopePrefix: prefix };
        }
        return null;
    }

    /**
     * Resolve a key and return a detailed trace explaining which definition
     * was chosen and why.  Mirrors resolveKey() exactly but records every
     * lookup step — including failed attempts — so callers can explain resolution
     * to users or drive diagnostic messages.
     */
    public async explainKey(
        keyName: string,
        contextFilePath: string
    ): Promise<KeyResolutionReport> {
        const report: KeyResolutionReport = {
            keyName,
            contextFilePath,
            resolvedDefinition: null,
            steps: [],
            keyrefChain: [],
        };

        const rootMap = await this.findRootMap(contextFilePath);
        if (!rootMap) {
            report.steps.push({
                type: 'unqualified-lookup',
                attempted: keyName,
                found: false,
                note: 'No root map found for context file; key space cannot be built',
            });
            return report;
        }

        const keySpace = await this.buildKeySpace(rootMap);

        // The same lookups as resolveKey(), in the same order: the root scope first,
        // then each scope down to the context scope (enclosing scopes take precedence).
        const contextScope = this.contextScope(keySpace, contextFilePath);
        if (contextScope) report.contextScope = contextScope;
        for (const prefix of KeySpaceService.scopeLookupOrder(contextScope)) {
            const attempted = prefix ? `${prefix}.${keyName}` : keyName;
            const keyDef = keySpace.keys.get(attempted);
            const sourceLabel = keyDef
                ? `${path.basename(keyDef.sourceMap)}${keyDef.sourceLine ? ':' + keyDef.sourceLine : ''}`
                : '';
            report.steps.push(prefix ? {
                type: 'context-scope-lookup',
                attempted,
                found: !!keyDef,
                definition: keyDef,
                note: keyDef
                    ? `Matched "${attempted}" in key scope "${prefix}" (source: ${sourceLabel})`
                    : `Tried "${attempted}" in key scope "${prefix}" — not found`,
            } : {
                type: 'unqualified-lookup',
                attempted,
                found: !!keyDef,
                definition: keyDef,
                note: keyDef
                    ? `Matched "${attempted}" in the root key scope, which takes precedence (source: ${sourceLabel})`
                    : contextScope
                        ? `Key "${attempted}" not defined in the root key scope`
                        : `Key "${attempted}" not found in key space`,
            });
            if (keyDef) {
                const { def: resolved, chain } = this.followKeyrefChainWithTrace(keyDef, keySpace.keys, prefix);
                this.appendKeyrefSteps(report.steps, chain, keySpace.keys);
                report.keyrefChain = chain;
                report.resolvedDefinition = resolved;
                return report;
            }
        }

        // Step 3 — deferred peer map lookup (Gap 4)
        const dotIdx = keyName.indexOf('.');
        if (dotIdx > 0 && keySpace.deferredPeerMaps.size > 0) {
            const peerScopeName = keyName.slice(0, dotIdx);
            const peerKey = keyName.slice(dotIdx + 1);
            const peerMapPath = keySpace.deferredPeerMaps.get(peerScopeName);
            const peerStep: ResolutionStep = {
                type: 'peer-map-lookup',
                attempted: keyName,
                found: false,
                note: peerMapPath
                    ? `Trying peer map for scope "${peerScopeName}": ${path.basename(peerMapPath)}`
                    : `Scope "${peerScopeName}" is not a registered peer scope`,
            };
            report.steps.push(peerStep);
            if (peerMapPath) {
                try {
                    const peerKeySpace = await this.buildKeySpace(peerMapPath);
                    const peerDef = peerKeySpace.keys.get(peerKey) ?? null;
                    if (peerDef) {
                        peerStep.found = true;
                        peerStep.definition = peerDef;
                        peerStep.note = `Found "${peerKey}" in peer map "${path.basename(peerMapPath)}"`;
                        const lastDot = peerKey.lastIndexOf('.');
                        const peerKeyScope = lastDot > 0 ? peerKey.slice(0, lastDot) : '';
                        const { def: resolved, chain } = this.followKeyrefChainWithTrace(peerDef, peerKeySpace.keys, peerKeyScope);
                        this.appendKeyrefSteps(report.steps, chain, peerKeySpace.keys);
                        report.keyrefChain = chain;
                        report.resolvedDefinition = resolved;
                    } else {
                        peerStep.note = `Key "${peerKey}" not found in peer map "${path.basename(peerMapPath)}"`;
                    }
                } catch {
                    peerStep.note = `Peer map "${path.basename(peerMapPath)}" could not be loaded`;
                }
            }
        }

        return report;
    }

    /**
     * Returns the key names usable from the given context file, each with its effective
     * definition. Finds the root map and builds (or retrieves cached) key space.
     * Used by completion to offer the available key names.
     *
     * From the root scope, these are all the keys of the key space (child scopes' keys by
     * their scope-qualified names). From a child scope, the names of each enclosing scope
     * are added relative to it, the outermost definition winning, as in lookupKey().
     */
    public async getAllKeys(
        contextFilePath: string
    ): Promise<Map<string, KeyDefinition>> {
        const rootMap = await this.findRootMap(contextFilePath);
        if (!rootMap) {
            return new Map();
        }

        const keySpace = await this.buildKeySpace(rootMap);
        const scope = this.contextScope(keySpace, contextFilePath);
        if (!scope) return keySpace.keys;
        const visible = new Map(keySpace.keys);
        for (const prefix of KeySpaceService.scopeLookupOrder(scope).slice(1)) {
            for (const [name, def] of keySpace.keys) {
                if (!name.startsWith(`${prefix}.`)) continue;
                const relative = name.slice(prefix.length + 1);
                if (!visible.has(relative)) visible.set(relative, def);
            }
        }
        return visible;
    }

    /**
     * Get subject scheme map paths discovered during key space build.
     */
    public async getSubjectSchemePaths(
        contextFilePath: string
    ): Promise<string[]> {
        const rootMap = await this.findRootMap(contextFilePath);
        if (!rootMap) {
            return [];
        }

        const keySpace = await this.buildKeySpace(rootMap);
        return keySpace.subjectSchemePaths;
    }

    /**
     * Get duplicate key definitions from the key space for the given context file.
     * Returns a map of key name → array of all definitions (effective + duplicates).
     */
    public async getDuplicateKeys(
        contextFilePath: string
    ): Promise<Map<string, KeyDefinition[]>> {
        const rootMap = await this.findRootMap(contextFilePath);
        if (!rootMap) {
            return new Map();
        }

        const keySpace = await this.buildKeySpace(rootMap);
        return keySpace.duplicateKeys;
    }

    /**
     * Build key space from a root map. Uses cache + in-flight dedup.
     */
    public async buildKeySpace(rootMapPath: string): Promise<KeySpace> {
        const absoluteRootPath = path.isAbsolute(rootMapPath)
            ? rootMapPath
            : path.resolve(rootMapPath);

        // Check cache
        const cached = this.keySpaceCache.get(absoluteRootPath);
        if (cached && (Date.now() - cached.buildTime) < this.cacheConfig.ttlMs) {
            return cached;
        }

        // In-flight dedup
        const pendingBuild = this.pendingBuilds.get(absoluteRootPath);
        if (pendingBuild) {
            return pendingBuild;
        }

        const generationAtStart = this.cacheGeneration;
        const invalidationLogStart = this.invalidationLog.length;
        this.inFlightBuilds++;
        const buildPromise = this.doBuildKeySpace(absoluteRootPath);
        this.pendingBuilds.set(absoluteRootPath, buildPromise);

        try {
            const keySpace = await buildPromise;
            if (this.isBuildStale(generationAtStart, invalidationLogStart, keySpace)) {
                // An invalidation affecting this build raced with it: the result
                // may be based on pre-change file reads. Serve it once but don't keep it.
                this.keySpaceCache.delete(absoluteRootPath);
            }
            return keySpace;
        } finally {
            this.inFlightBuilds--;
            // Invalidation may have cleared our entry (so newer callers rebuild);
            // only remove it if it is still ours.
            if (this.pendingBuilds.get(absoluteRootPath) === buildPromise) {
                this.pendingBuilds.delete(absoluteRootPath);
            }
            if (this.inFlightBuilds === 0) {
                this.invalidationLog.length = 0;
            }
        }
    }

    /**
     * Did an invalidation that affects THIS build happen while it ran?
     * Structural invalidations (generation bump) affect every build; per-file
     * invalidations only affect builds whose map hierarchy contains the file.
     */
    private isBuildStale(
        generationAtStart: number,
        invalidationLogStart: number,
        keySpace: KeySpace,
    ): boolean {
        if (generationAtStart !== this.cacheGeneration) return true;
        if (invalidationLogStart >= this.invalidationLog.length) return false;
        const changed = new Set(this.invalidationLog.slice(invalidationLogStart));
        return keySpace.mapHierarchy.some(m => changed.has(normalizeFsPath(m)));
    }

    /**
     * Find root map for a given file by searching upward through directories.
     *
     * The candidates are the explicit root map set via setExplicitRootMap(),
     * then the maps found from the file's directory up to its workspace
     * folder, the highest directory first and, in a directory,
     * root.ditamap > main.ditamap > master.ditamap > alphabetical order. The
     * first candidate whose maps reference the file (a topicref, a key
     * definition or a submap) is its root map: a map that does not know the
     * file — another publication of the workspace, even the explicit root
     * map — is passed over. A file no candidate references (a topic not yet
     * in a map, an archived one) belongs to the publication of its folder:
     * the first candidate that references a topic in its folder, else in the
     * folder above, and so on. Failing that, the explicit root map, else the
     * first map found, is used.
     */
    public async findRootMap(filePath: string): Promise<string | null> {
        const absolutePath = path.isAbsolute(filePath)
            ? filePath
            : path.resolve(filePath);
        const fileKey = normalizeFsPath(absolutePath);

        const cached = this.rootMapCache.get(fileKey);
        if (cached && (Date.now() - cached.timestamp) < ROOT_MAP_CACHE_TTL_MS) {
            return cached.rootMap;
        }

        const generationAtStart = this.rootMapChoiceGeneration;
        const rootMap = await this.chooseRootMap(absolutePath, fileKey);

        if (generationAtStart === this.rootMapChoiceGeneration) {
            this.rootMapCache.set(fileKey, { rootMap, timestamp: Date.now() });
        }
        return rootMap;
    }

    /** findRootMap's choice: the first candidate referencing the file, else its fallbacks. */
    private async chooseRootMap(absolutePath: string, fileKey: string): Promise<string | null> {
        const explicit = this.explicitRootMapPath;
        const candidates: { map: string; refs: ReferencedFiles }[] = [];
        if (explicit) {
            const refs = this.referencedFiles(await this.buildKeySpace(explicit));
            if (refs.files.has(fileKey)) return explicit;
            candidates.push({ map: explicit, refs });
        }

        const explicitKey = explicit ? normalizeFsPath(explicit) : null;
        const discovered = (await this.findRootMapCandidates(absolutePath))
            .filter(candidate => normalizeFsPath(candidate) !== explicitKey);
        for (const candidate of discovered.slice(0, MAX_ROOT_MAP_CANDIDATES)) {
            const refs = this.referencedFiles(await this.buildKeySpace(candidate));
            if (refs.files.has(fileKey)) return candidate;
            candidates.push({ map: candidate, refs });
        }

        // No map references the file: the publication of its folder, or of
        // the nearest folder above, takes it — a candidate another one uses as
        // a submap or peer map is part of that publication, not its root.
        const usedByOthers = new Set<string>();
        for (const candidate of candidates) {
            for (const map of candidate.refs.maps) usedByOthers.add(map);
        }
        const roots = candidates.filter(candidate => !usedByOthers.has(normalizeFsPath(candidate.map)));
        for (let dir = path.dirname(fileKey); ; dir = path.dirname(dir)) {
            const owner = roots.find(candidate => candidate.refs.folders.has(dir));
            if (owner) return owner.map;
            if (path.dirname(dir) === dir) break;
        }
        return explicit ?? discovered[0] ?? null;
    }

    /** The files a key space's maps reference, and the folders of its topics (normalized paths). */
    private referencedFiles(keySpace: KeySpace): ReferencedFiles {
        let refs = this.referencedFilesCache.get(keySpace);
        if (!refs) {
            const topics = new Set(keySpace.topicToScope.keys());
            for (const def of keySpace.keys.values()) {
                if (def.targetFile) topics.add(normalizeFsPath(def.targetFile));
            }
            for (const defs of keySpace.duplicateKeys.values()) {
                for (const def of defs) {
                    if (def.targetFile) topics.add(normalizeFsPath(def.targetFile));
                }
            }
            // A folder and every folder above it, for each topic (the maps
            // themselves are left out: a map in a folder does not make its
            // topics live there).
            const folders = new Set<string>();
            for (const topic of topics) {
                for (let dir = path.dirname(topic); !folders.has(dir); dir = path.dirname(dir)) {
                    folders.add(dir);
                    if (path.dirname(dir) === dir) break;
                }
            }
            const rootKey = normalizeFsPath(keySpace.rootMap);
            const maps = new Set<string>();
            for (const map of [...keySpace.mapHierarchy, ...keySpace.deferredPeerMaps.values()]) {
                const mapKey = normalizeFsPath(map);
                if (mapKey !== rootKey) maps.add(mapKey);
            }
            const files = new Set(topics);
            for (const map of keySpace.mapHierarchy) files.add(normalizeFsPath(map));
            refs = { files, folders, maps };
            this.referencedFilesCache.set(keySpace, refs);
        }
        return refs;
    }

    /** The candidate root maps for a file, in findRootMap's order (cached per directory). */
    private async findRootMapCandidates(absolutePath: string): Promise<string[]> {
        const cacheKey = path.dirname(absolutePath);

        const cached = this.rootMapCandidatesCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < ROOT_MAP_CACHE_TTL_MS) {
            return cached.candidates;
        }

        // In-flight dedup: many concurrent callers for files in the same
        // directory (e.g. every keyref usage of a key, resolved concurrently
        // during rename/find-references) share this cacheKey — without this,
        // each would fire its own redundant upward-directory walk on a cold
        // cache instead of sharing the one already in progress.
        const pendingLookup = this.pendingRootMapLookups.get(cacheKey);
        if (pendingLookup) {
            return pendingLookup;
        }

        const lookupPromise = this.doFindRootMapCandidates(absolutePath, cacheKey);
        this.pendingRootMapLookups.set(cacheKey, lookupPromise);
        try {
            return await lookupPromise;
        } finally {
            // Invalidation may have cleared our entry already; only remove it
            // if it's still ours, same guard buildKeySpace uses for pendingBuilds.
            if (this.pendingRootMapLookups.get(cacheKey) === lookupPromise) {
                this.pendingRootMapLookups.delete(cacheKey);
            }
        }
    }

    /** The actual upward-directory walk behind findRootMap(), run at most once
     *  per cacheKey concurrently thanks to pendingRootMapLookups above. */
    private async doFindRootMapCandidates(absolutePath: string, cacheKey: string): Promise<string[]> {
        let currentDir = path.dirname(absolutePath);
        // Stop at the workspace folder that actually contains the file
        // (multi-root safe). Deliberate: a root map living ABOVE a workspace
        // folder is outside the workspace and is not discovered.
        // Files outside every folder get a short bounded walk instead —
        // never up to $HOME or the fs root, where a stray .ditamap would
        // hijack root-map discovery ("higher directories overwrite lower").
        const containingFolder = findContainingWorkspaceFolder(currentDir, this.workspaceFolders);
        const stopDir = containingFolder ?? null;
        const maxLevels = stopDir === null ? OUTSIDE_WORKSPACE_MAX_WALK_LEVELS : Number.POSITIVE_INFINITY;

        // Skip the cache write below if any invalidation runs while we
        // are awaiting readdir — same stale-write guard as buildKeySpace.
        const generationAtStart = this.cacheGeneration;

        // Search up to the stop directory.
        // Root maps are typically at the project root, so maps at the
        // highest level (closest to workspace root) come first.
        const preferredNames = ['root.ditamap', 'main.ditamap', 'master.ditamap'];
        const candidates: string[] = [];
        let level = 0;

        while (currentDir) {
            const dir = currentDir;
            try {
                const files = await fsPromises.readdir(dir);
                const mapFiles = files.filter(f =>
                    f.endsWith('.ditamap') || f.endsWith('.bookmap')
                ).sort();
                const ordered = [
                    ...preferredNames.filter(name => mapFiles.includes(name)),
                    ...mapFiles.filter(name => !preferredNames.includes(name)),
                ];
                // Higher directories go before lower — root maps live at project root
                candidates.unshift(...ordered.map(name => path.join(dir, name)));
            } catch {
                // Directory not readable
            }

            level++;
            if (stopDir !== null && normalizeFsPath(currentDir) === normalizeFsPath(stopDir)) break;
            if (level >= maxLevels) break;
            const parentDir = path.dirname(currentDir);
            if (parentDir === currentDir) break;
            currentDir = parentDir;
        }

        if (generationAtStart === this.cacheGeneration) {
            this.rootMapCandidatesCache.set(cacheKey, { candidates, timestamp: Date.now() });
        }
        return candidates;
    }

    /**
     * Invalidate cache entries for a changed file (debounced).
     * @param pathChanged true when the file was created, deleted, or renamed —
     *   only such changes can alter the candidate root maps found by name, so
     *   plain content edits keep that cache intact (they still reset the
     *   root maps chosen for files, which depend on the maps' references).
     */
    public invalidateForFile(changedFile: string, pathChanged = false): void {
        const existing = this.pendingInvalidations.get(changedFile) ?? false;
        this.pendingInvalidations.set(changedFile, existing || pathChanged);

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            for (const [file, pc] of this.pendingInvalidations) {
                this.doInvalidate(file, pc);
            }
            this.pendingInvalidations.clear();
            this.debounceTimer = undefined;
        }, FILE_WATCHER_DEBOUNCE_MS);
    }

    /**
     * Invalidate cache entries for a changed file at once, as invalidateForFile
     * does after its debounce. For callers that detect changes themselves right
     * before using the key space (the MCP server, which has no file watcher).
     */
    public invalidateForFileNow(changedFile: string, pathChanged = false): void {
        const pending = this.pendingInvalidations.get(changedFile);
        this.pendingInvalidations.delete(changedFile);
        this.doInvalidate(changedFile, pathChanged || pending === true);
    }

    /** Update workspace folders (on workspace change events). */
    public updateWorkspaceFolders(added: string[], removed: string[]): void {
        for (const r of removed) {
            const idx = this.workspaceFolders.indexOf(r);
            if (idx >= 0) this.workspaceFolders.splice(idx, 1);
        }
        this.workspaceFolders.push(...added);

        // Invalidate all caches since workspace context changed
        this.invalidateAllCaches();
    }

    /** Reload cache configuration from settings. */
    public async reloadCacheConfig(): Promise<void> {
        try {
            const settings = await this.getSettings();
            this.cacheConfig = {
                ttlMs: settings.keySpaceCacheTtlMinutes * ONE_MINUTE_MS,
                maxSize: MAX_KEY_SPACES,
            };
            this.cleanupExpiredCacheEntries();
        } catch {
            // Settings not available yet (during init); keep defaults
        }
    }

    /** Clean up timers and caches on shutdown. */
    public shutdown(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = undefined;
        }
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
        this.pendingInvalidations.clear();
        this.keySpaceCache.clear();
        this.rootMapCache.clear();
        this.rootMapCandidatesCache.clear();
    }

    // --- Internal: BFS traversal ---

    private async doBuildKeySpace(absoluteRootPath: string): Promise<KeySpace> {
        this.log(`Building key space from ${path.basename(absoluteRootPath)}`);

        const keySpace: KeySpace = {
            rootMap: absoluteRootPath,
            keys: new Map(),
            buildTime: Date.now(),
            mapHierarchy: [],
            subjectSchemePaths: [],
            duplicateKeys: new Map(),
            topicToScope: new Map(),
            deferredPeerMaps: new Map(),
        };

        const visited = new Set<string>();
        const queue: { mapPath: string; scopePrefixes: string[] }[] = [
            { mapPath: absoluteRootPath, scopePrefixes: [] },
        ];
        let maxLinkMatches = 10000;

        try {
            const settings = await this.getSettings();
            maxLinkMatches = settings.maxLinkMatches;
        } catch {
            // Use default
        }

        // Caches each map's own key definitions, root @keyscope, and submap
        // references the first time it is traversed, so a later encounter of
        // the same map via a *different* mapref @keyscope (diamond-shaped
        // scope graph) can still register that map's keys — and re-queue its
        // submaps — under the new scope namespace without re-parsing the file.
        const mapDirectKeysCache = new Map<string, {
            keys: KeyDefinition[];
            rootScopes: string[];
            submaps: { path: string; keyscopes: string[]; inlineKeys: string[]; isPeer: boolean }[];
        }>();

        // Tracks which effective scope-prefix combinations have already been
        // registered for each map path, so a diamond graph that reaches the
        // same map+scope combination more than once (including via cycles
        // introduced by re-queueing submaps below) doesn't redo the same work
        // or loop forever.
        const registeredScopeSignatures = new Map<string, Set<string>>();
        const scopeSignature = (prefixes: readonly string[]): string =>
            [...prefixes].sort().join('\u0000');
        // The first definition of each key in each key scope (qualified name: "scope.key", or
        // the key name in the root scope), to find the keys defined again in the same scope
        const firstDefinitionInScope = new Map<string, KeyDefinition>();
        // The scope of the root map, set by the first map of the traversal
        let rootScopeSignature: string | undefined;

        while (queue.length > 0) {
            const { mapPath: currentMap, scopePrefixes } = queue.shift()!;
            const normalizedPath = normalizeFsPath(currentMap);

            if (visited.has(normalizedPath)) {
                const cached = mapDirectKeysCache.get(normalizedPath);
                if (!cached) continue;

                const effectivePrefixes = this.combineScopePrefixes(scopePrefixes, cached.rootScopes);
                const signature = scopeSignature(effectivePrefixes);
                let seenSignatures = registeredScopeSignatures.get(normalizedPath);
                if (!seenSignatures) {
                    seenSignatures = new Set();
                    registeredScopeSignatures.set(normalizedPath, seenSignatures);
                }
                if (seenSignatures.has(signature)) continue;
                seenSignatures.add(signature);

                this.registerKeysForAdditionalScope(
                    keySpace, cached.keys, scopePrefixes, cached.rootScopes
                );

                // Re-queue this map's submaps under the new scope too — otherwise
                // nested maps stay unresolvable under the second scope path even
                // though they were already reachable under the first.
                for (const submap of cached.submaps) {
                    if (submap.isPeer) continue;
                    const childPrefixes = this.combineScopePrefixes(effectivePrefixes, submap.keyscopes);
                    this.registerInlineMaprefKeys(
                        keySpace, submap.inlineKeys, currentMap, submap.path, childPrefixes
                    );
                    queue.push({ mapPath: submap.path, scopePrefixes: childPrefixes });
                }
                continue;
            }

            const fileExists = await this.fileExistsAsync(currentMap);
            if (!fileExists) continue;

            visited.add(normalizedPath);
            keySpace.mapHierarchy.push(currentMap);

            try {
                // Without the byte order mark, as in the editor's text
                const rawContent = (await fsPromises.readFile(currentMap, 'utf-8')).replace(/^\uFEFF/, '');
                // Strip comments/CDATA first, then reltable blocks.
                // reltable hrefs are relationship-table links — not key-space content (spec §2.4.4).
                const mapContent = this.stripReltables(stripCommentsAndCDATA(rawContent));

                const rootScopes = this.extractRootKeyscope(mapContent);
                const effectivePrefixes = this.combineScopePrefixes(scopePrefixes, rootScopes);
                // The primary prefix is the first (canonical) scope path for this map,
                // used for topic-to-scope tracking.
                const primaryPrefix = effectivePrefixes[0] ?? '';
                // The scope of the root map (named by its own @keyscope, if any) is the root
                // scope: its keys are the unqualified key names.
                const signature = scopeSignature(effectivePrefixes);
                rootScopeSignature ??= signature;
                const inRootScope = signature === rootScopeSignature;
                // Key references written in this map resolve in its scope
                keySpace.mapToScope ??= new Map();
                if (!keySpace.mapToScope.has(normalizedPath)) keySpace.mapToScope.set(normalizedPath, primaryPrefix);

                // Handle inline scope branches (topicrefs with @keyscope that don't
                // reference an external map).  Returns mapContent with those blocks
                // blanked out so that child-scope keys are not re-processed here.
                const maskedContent = this.processInlineScopeBlocks(
                    mapContent, currentMap, effectivePrefixes,
                    keySpace, queue, maxLinkMatches
                );

                const keys = this.extractKeyDefinitions(maskedContent, currentMap, maxLinkMatches);
                let seenSignatures = registeredScopeSignatures.get(normalizedPath);
                if (!seenSignatures) {
                    seenSignatures = new Set();
                    registeredScopeSignatures.set(normalizedPath, seenSignatures);
                }
                seenSignatures.add(scopeSignature(effectivePrefixes));
                for (const keyDef of keys) {
                    // Unqualified entry: the keys of the root scope only (first definition wins).
                    // Keys of child scopes are reachable by their scope-qualified names
                    // (DITA 1.3 §2.3.4.1: "Keys defined in child scopes cannot be addressed
                    // without qualifiers").
                    if (inRootScope && !keySpace.keys.has(keyDef.keyName)) {
                        keySpace.keys.set(keyDef.keyName, keyDef);
                    }

                    // A key defined again in the same key scope: only the first definition takes
                    // effect (DITA-OT: DOTJ045I). Definitions in different scopes do not collide.
                    const scopedName = primaryPrefix ? `${primaryPrefix}.${keyDef.keyName}` : keyDef.keyName;
                    const firstInScope = firstDefinitionInScope.get(scopedName);
                    if (!firstInScope) {
                        firstDefinitionInScope.set(scopedName, keyDef);
                    } else {
                        let dups = keySpace.duplicateKeys.get(scopedName);
                        if (!dups) {
                            dups = [firstInScope];
                            keySpace.duplicateKeys.set(scopedName, dups);
                        }
                        dups.push(keyDef);
                    }

                    // Scope-qualified entries — first definition per qualified name wins.
                    for (const prefix of effectivePrefixes) {
                        const qualifiedName = `${prefix}.${keyDef.keyName}`;
                        this.addScopedKeyEntry(keySpace, qualifiedName, { ...keyDef, keyName: qualifiedName });
                    }
                }

                // Record which scope each referenced topic belongs to.
                // This is used later in resolveKey() for context-aware lookup.
                this.extractTopicReferences(
                    maskedContent, currentMap, primaryPrefix, keySpace.topicToScope, maxLinkMatches
                );

                if (this.isSubjectSchemeMap(rawContent)) {
                    keySpace.subjectSchemePaths.push(currentMap);
                }

                // Use maskedContent so submaps inside inline scope blocks are not
                // queued again (processInlineScopeBlocks already queued them with the
                // correct child scope prefix).
                const submaps = this.extractMapReferences(maskedContent, currentMap, maxLinkMatches);
                mapDirectKeysCache.set(normalizedPath, { keys, rootScopes, submaps });
                for (const submap of submaps) {
                    // Peer maps are not inlined; register them for lazy resolution on key miss.
                    if (submap.isPeer) {
                        for (const scopeName of submap.keyscopes) {
                            if (!keySpace.deferredPeerMaps.has(scopeName)) {
                                keySpace.deferredPeerMaps.set(scopeName, submap.path);
                            }
                        }
                        continue;
                    }

                    const childPrefixes = this.combineScopePrefixes(effectivePrefixes, submap.keyscopes);

                    // Register @keys defined on the mapref element itself under the child scope prefix.
                    // The mapref element is included in the child scope it creates (DITA spec §2.4.4.1).
                    this.registerInlineMaprefKeys(
                        keySpace, submap.inlineKeys, currentMap, submap.path, childPrefixes
                    );

                    queue.push({ mapPath: submap.path, scopePrefixes: childPrefixes });
                }
            } catch {
                // Error reading/parsing map, skip
            }
        }

        this.log(`Key space built: ${keySpace.keys.size} keys from ${keySpace.mapHierarchy.length} maps`);
        this.cacheKeySpace(keySpace);
        return keySpace;
    }

    // --- Internal: Key extraction ---

    /**
     * Parse the preprocessed map XML with fast-xml-parser and return a flat list
     * of all elements (tag name + attributes).  DOCTYPE is stripped before parsing.
     * Returns null on parse failure so the caller can fall back to regex extraction.
     */
    private parseMapElements(
        mapContent: string
    ): Array<{ tagName: string; attrs: Record<string, string>; node: Record<string, unknown> }> | null {
        // Strip DOCTYPE — fast-xml-parser chokes on internal subsets.
        const stripped = mapContent.replace(
            /<!DOCTYPE\s[\s\S]*?(?:\[[\s\S]*?\]\s*)?>|<!DOCTYPE[^>]*>/gi,
            ''
        );
        try {
            const parsed = this.xmlParser.parse(stripped) as Record<string, unknown>;
            const ordered = this.orderedXmlParser.parse(stripped) as unknown[];
            const results: Array<{ tagName: string; attrs: Record<string, string>; node: Record<string, unknown> }> = [];
            this.collectXmlElements(ordered, parsed, results);
            return results;
        } catch {
            return null;
        }
    }

    /**
     * Collects the elements of a fast-xml-parser tree in document order.
     *
     * The grouped tree (`grouped`) gathers same-name siblings in one array, which loses
     * their order among other siblings: `<topicref keys="x"/><keydef keys="a"/><topicref
     * keys="y"/>` gives both topicrefs before the keydef, and the first definition of a key
     * is the one that takes effect. Its nodes are what key extraction reads (attributes,
     * topicmeta), so the walk follows the ordered tree (`ordered`, from `preserveOrder`)
     * and takes each element's node from the grouped one: the n-th `<keydef>` child of an
     * element is the n-th entry of its `keydef` group.
     * Strips namespace prefixes from both element names and attribute names.
     */
    private collectXmlElements(
        ordered: unknown[],
        grouped: Record<string, unknown>,
        out: Array<{ tagName: string; attrs: Record<string, string>; node: Record<string, unknown> }>
    ): void {
        const seen = new Map<string, number>();
        for (const entry of ordered) {
            if (typeof entry !== 'object' || entry === null) continue;
            const rawName = Object.keys(entry).find(key => key !== ':@');
            // Text, and processing instructions (?xml, ?pi-name), are not elements
            if (!rawName || rawName === '#text' || rawName.startsWith('?')) continue;
            const index = seen.get(rawName) ?? 0;
            seen.set(rawName, index + 1);
            const group = grouped[rawName];
            const node = Array.isArray(group) ? group[index] : index === 0 ? group : undefined;
            // An element without attributes or children is a string in the grouped tree: nothing to read
            if (typeof node !== 'object' || node === null) continue;
            const element = node as Record<string, unknown>;
            const attrs: Record<string, string> = {};
            for (const [key, val] of Object.entries(element)) {
                if (!key.startsWith('@_')) continue;
                // Strip @_ prefix and optional namespace prefix (ns:name → name)
                const attrName = key.slice(2).replace(/^\w+:/, '');
                attrs[attrName] = String(val ?? '');
            }
            out.push({ tagName: rawName.replace(/^\w+:/, ''), attrs, node: element });
            const children = (entry as Record<string, unknown>)[rawName];
            if (Array.isArray(children)) this.collectXmlElements(children, element, out);
        }
    }

    /**
     * Extract key metadata from a parsed topicmeta node (fast-xml-parser tree).
     */
    private extractMetadataFromNode(
        node: Record<string, unknown>
    ): { metadata: KeyMetadata | null; inlineContent: string | null } {
        const rawTopicmeta = node['topicmeta'];
        if (!rawTopicmeta || typeof rawTopicmeta !== 'object') return { metadata: null, inlineContent: null };
        // fxp returns an array when multiple topicmeta elements exist (invalid DITA) — use the first.
        const raw = Array.isArray(rawTopicmeta) ? rawTopicmeta[0] : rawTopicmeta;
        if (!raw || typeof raw !== 'object') return { metadata: null, inlineContent: null };
        const meta = raw as Record<string, unknown>;
        const metadata: KeyMetadata = {};
        let inlineContent: string | null = null;

        // navtitle
        const navtitleRaw = meta['navtitle'];
        if (typeof navtitleRaw === 'string') {
            metadata.navtitle = navtitleRaw.trim() || undefined;
        } else if (navtitleRaw && typeof navtitleRaw === 'object') {
            const t = (navtitleRaw as Record<string, unknown>)['#text'];
            if (typeof t === 'string') metadata.navtitle = t.trim() || undefined;
        }

        // keywords / keyword — their text, markup inside included (<tm>, <ph>…)
        const kwBlock = meta['keywords'];
        if (kwBlock && typeof kwBlock === 'object') {
            const kwRaw = (kwBlock as Record<string, unknown>)['keyword'];
            const kwList = (Array.isArray(kwRaw) ? kwRaw : [kwRaw]).map(nodeText).filter(t => t.length > 0);
            if (kwList.length > 0) { metadata.keywords = kwList; inlineContent = kwList[0]; }
        }
        if (!inlineContent) {
            const directKw = nodeText(meta['keyword']);
            if (directKw) {
                inlineContent = directKw; metadata.keywords = [inlineContent];
            }
        }
        // The key's text otherwise: <keytext> (DITA 2.0), else <linktext>
        if (!inlineContent) inlineContent = nodeText(meta['keytext']) || nodeText(meta['linktext']) || null;

        // shortdesc
        const sdRaw = meta['shortdesc'];
        if (typeof sdRaw === 'string') metadata.shortdesc = sdRaw.trim() || undefined;

        const hasMetadata = metadata.navtitle || metadata.keywords || metadata.shortdesc;
        return { metadata: hasMetadata ? metadata : null, inlineContent };
    }

    /**
     * Extract key definitions using fast-xml-parser for correctness (multi-line
     * attributes, namespace-prefixed attributes).  Falls back to regex on parse error.
     */
    private extractKeyDefinitions(
        mapContent: string,
        mapPath: string,
        maxMatches: number
    ): KeyDefinition[] {
        const elements = this.parseMapElements(mapContent);
        if (elements !== null) {
            return this.extractKeyDefinitionsFromElements(elements, mapPath, maxMatches, mapContent);
        }
        return this.extractKeyDefinitionsRegex(mapContent, mapPath, maxMatches);
    }

    /** XML-tree-based key extraction (primary path). */
    private extractKeyDefinitionsFromElements(
        elements: Array<{ tagName: string; attrs: Record<string, string>; node: Record<string, unknown> }>,
        mapPath: string,
        maxMatches: number,
        mapContent?: string
    ): KeyDefinition[] {
        const keys: KeyDefinition[] = [];
        const mapDir = path.dirname(mapPath);
        let matchCount = 0;
        // The start tags with @keys, in document order, each key name with its offset
        const keyTags = mapContent ? keyDefinitionTags(mapContent) : [];
        let nextKeyTag = 0;

        for (const { tagName, attrs, node } of elements) {
            const keysValue = attrs['keys'];
            if (!keysValue) continue;
            const isSubject = tagName.toLowerCase() === 'subjectdef';
            if (++matchCount > maxMatches) break;

            // Skip keyscoped submap refs — handled by the BFS inlineKeys mechanism.
            if (attrs['keyscope'] && /\.(?:ditamap|bookmap)$/i.test(attrs['href'] ?? '')) continue;

            const isSelfClosing = !Object.keys(node).some(k => !k.startsWith('@_') && k !== '#text');

            // Each key name's own line: the element's start tag is the next one, in document
            // order, with the same name and key names (a multi-key attribute can span lines)
            const keyNames = keysValue.split(/\s+/).filter(k => k.length > 0);
            let keyOffsets: number[] | undefined;
            for (let i = nextKeyTag; i < keyTags.length; i++) {
                const tag = keyTags[i];
                if (tag.elementName === tagName && tag.keyNames.join(' ') === keyNames.join(' ')) {
                    keyOffsets = tag.offsets;
                    nextKeyTag = i + 1;
                    break;
                }
            }

            for (let index = 0; index < keyNames.length; index++) {
                const keyName = keyNames[index];
                const keyDef: KeyDefinition = { keyName, sourceMap: mapPath };
                if (isSubject) keyDef.subject = true;
                const keyOffset = keyOffsets?.[index];
                if (keyOffset !== undefined && mapContent) {
                    keyDef.sourceLine = this.computeLineNumber(mapContent, keyOffset);
                }

                const href = attrs['href'] ?? '';
                if (isWebAddress(href)) {
                    keyDef.externalHref = href;
                } else if (href) {
                    if (href.includes('#')) {
                        const [filePart, elemId] = href.split('#', 2);
                        if (filePart) {
                            const resolved = path.resolve(mapDir, filePart);
                            if (this.isPathWithinWorkspace(resolved)) keyDef.targetFile = resolved;
                        }
                        if (elemId) keyDef.elementId = elemId;
                    } else {
                        const resolved = path.resolve(mapDir, href);
                        if (this.isPathWithinWorkspace(resolved)) keyDef.targetFile = resolved;
                    }
                }
                if (attrs['scope']) keyDef.scope = attrs['scope'];
                if (attrs['processing-role']) keyDef.processingRole = attrs['processing-role'];
                if (attrs['keyref']) keyDef.keyref = attrs['keyref'];

                if (!isSelfClosing) {
                    const metaResult = this.extractMetadataFromNode(node);
                    if (metaResult.metadata) keyDef.metadata = metaResult.metadata;
                    if (!keyDef.targetFile && metaResult.inlineContent) {
                        keyDef.inlineContent = metaResult.inlineContent;
                    }
                }
                keys.push(keyDef);
            }
        }
        return keys;
    }

    /** Regex-based key extraction (fallback for malformed XML). */
    private extractKeyDefinitionsRegex(
        mapContent: string,
        mapPath: string,
        maxMatches: number
    ): KeyDefinition[] {
        const keys: KeyDefinition[] = [];
        const mapDir = path.dirname(mapPath);

        const keydefRegex = new RegExp(`<(\\w+)\\b${TAG_ATTRS}\\bkeys\\s*=\\s*["']([^"']+)["']${TAG_ATTRS}>`, 'gi');
        let match: RegExpExecArray | null;
        let matchCount = 0;
        // Each start tag's key names with their offsets, by the offset of the tag
        const keyTags = new Map(keyDefinitionTags(mapContent).map(tag => [tag.elementOffset, tag]));

        while ((match = keydefRegex.exec(mapContent)) !== null) {
            if (++matchCount > maxMatches) break;

            const keysValue = match[2];
            const fullElement = match[0];

            // Skip elements that carry @keyscope AND reference a submap file.
            // Their @keys belong to the child scope and are registered by the BFS
            // submap loop (via extractMapReferences inlineKeys), not here.
            const hasKeyscope = /\bkeyscope\s*=\s*["'][^"']+["']/i.test(fullElement);
            const hasMapHref = /\bhref\s*=\s*["'][^"']*\.(?:ditamap|bookmap)["']/i.test(fullElement);
            if (hasKeyscope && hasMapHref) continue;

            const keyNames = keysValue.split(/\s+/).filter(k => k.length > 0);

            // The key names' own offsets, when the scanner read the same key names in this tag
            const keyTag = keyTags.get(match.index);
            const keyOffsets = keyTag && keyTag.keyNames.join(' ') === keyNames.join(' ') ? keyTag.offsets : undefined;

            for (let index = 0; index < keyNames.length; index++) {
                const keyName = keyNames[index];
                const keyDef: KeyDefinition = {
                    keyName,
                    sourceMap: mapPath,
                };
                if (match[1].toLowerCase() === 'subjectdef') keyDef.subject = true;
                const keyOffset = keyOffsets?.[index];
                if (keyOffset !== undefined) keyDef.sourceLine = this.computeLineNumber(mapContent, keyOffset);

                // Extract href
                const hrefMatch = fullElement.match(/\bhref\s*=\s*["']([^"']+)["']/i);
                if (hrefMatch) {
                    const href = hrefMatch[1];
                    if (isWebAddress(href)) {
                        keyDef.externalHref = href;
                    } else if (href.includes('#')) {
                        const [filePart, elementId] = href.split('#');
                        if (filePart) {
                            const resolvedPath = path.resolve(mapDir, filePart);
                            if (this.isPathWithinWorkspace(resolvedPath)) {
                                keyDef.targetFile = resolvedPath;
                            }
                        }
                        if (elementId) {
                            keyDef.elementId = elementId;
                        }
                    } else {
                        const resolvedPath = path.resolve(mapDir, href);
                        if (this.isPathWithinWorkspace(resolvedPath)) {
                            keyDef.targetFile = resolvedPath;
                        }
                    }
                }

                // Extract scope
                const scopeMatch = fullElement.match(/\bscope\s*=\s*["']([^"']+)["']/i);
                if (scopeMatch) keyDef.scope = scopeMatch[1];

                // Extract processing-role
                const roleMatch = fullElement.match(/\bprocessing-role\s*=\s*["']([^"']+)["']/i);
                if (roleMatch) keyDef.processingRole = roleMatch[1];

                // Extract keyref (indirect key alias — resolution follows the chain)
                const keyrefMatch = fullElement.match(/\bkeyref\s*=\s*["']([^"']+)["']/i);
                if (keyrefMatch) keyDef.keyref = keyrefMatch[1];

                // Extract metadata from <topicmeta> child (navtitle, keywords, shortdesc)
                // Skip metadata extraction for self-closing elements (no child content)
                const isSelfClosing = fullElement.endsWith('/>');
                const metadataResult = isSelfClosing
                    ? { metadata: null, inlineContent: null }
                    : this.extractKeyMetadata(mapContent, match.index);
                if (metadataResult.metadata) {
                    keyDef.metadata = metadataResult.metadata;
                }

                // Inline content (keydef without href)
                if (!keyDef.targetFile) {
                    if (metadataResult.inlineContent) {
                        keyDef.inlineContent = metadataResult.inlineContent;
                    }
                }

                keys.push(keyDef);
            }
        }

        return keys;
    }

    /**
     * Extract metadata from the <topicmeta> child of a key-defining element.
     * Extracts navtitle, keywords, and shortdesc.
     */
    private extractKeyMetadata(
        mapContent: string,
        startIndex: number
    ): { metadata: KeyMetadata | null; inlineContent: string | null } {
        // Look ahead from the element start for a <topicmeta> block
        // Limit search to avoid crossing into sibling elements
        const afterElement = mapContent.substring(startIndex, startIndex + 2000);
        const topicmetaMatch = afterElement.match(
            /<topicmeta\b[^>]*>([\s\S]*?)<\/topicmeta>/i
        );
        if (!topicmetaMatch) {
            return { metadata: null, inlineContent: null };
        }

        const metaContent = topicmetaMatch[1];
        const metadata: KeyMetadata = {};
        let inlineContent: string | null = null;

        // Extract navtitle (from <navtitle> element inside topicmeta)
        const navtitleMatch = metaContent.match(/<navtitle\b[^>]*>([^<]+)<\/navtitle>/i);
        if (navtitleMatch) {
            metadata.navtitle = navtitleMatch[1].trim();
        }

        // Extract keywords (all <keyword> elements inside <keywords>)
        const keywordsBlockMatch = metaContent.match(
            /<keywords\b[^>]*>([\s\S]*?)<\/keywords>/i
        );
        // An element's text, markup inside included (<tm>, <ph>…)
        const textOf = (content: string): string => content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

        if (keywordsBlockMatch) {
            const kwContent = keywordsBlockMatch[1];
            const kwRegex = /<keyword\b[^>]*>([\s\S]*?)<\/keyword>/gi;
            const keywords: string[] = [];
            let kwMatch: RegExpExecArray | null;
            while ((kwMatch = kwRegex.exec(kwContent)) !== null) {
                const text = textOf(kwMatch[1]);
                if (text) keywords.push(text);
            }
            if (keywords.length > 0) {
                metadata.keywords = keywords;
                // First keyword is the inline content
                inlineContent = keywords[0];
            }
        }

        // Fallback: keyword directly in topicmeta (without <keywords> wrapper)
        if (!inlineContent) {
            const directKwMatch = metaContent.match(/<keyword\b[^>]*>([\s\S]*?)<\/keyword>/i);
            if (directKwMatch && textOf(directKwMatch[1])) {
                inlineContent = textOf(directKwMatch[1]);
                if (!metadata.keywords) {
                    metadata.keywords = [inlineContent];
                }
            }
        }

        // The key's text otherwise: <keytext> (DITA 2.0), else <linktext>
        for (const element of ['keytext', 'linktext']) {
            if (inlineContent) break;
            const textMatch = metaContent.match(new RegExp(`<${element}\\b[^>]*>([\\s\\S]*?)</${element}>`, 'i'));
            if (textMatch && textOf(textMatch[1])) inlineContent = textOf(textMatch[1]);
        }

        // Extract shortdesc
        const shortdescMatch = metaContent.match(/<shortdesc\b[^>]*>([^<]+)<\/shortdesc>/i);
        if (shortdescMatch) {
            metadata.shortdesc = shortdescMatch[1].trim();
        }

        const hasMetadata = metadata.navtitle || metadata.keywords || metadata.shortdesc;
        return {
            metadata: hasMetadata ? metadata : null,
            inlineContent,
        };
    }

    /**
     * Follow @keyref chains up to hopsRemaining hops.
     * Returns the original definition unchanged when no chain exists, the chain
     * is broken (target key missing), or the hop limit / cycle guard fires.
     */
    private followKeyrefChain(
        keyDef: KeyDefinition,
        keys: Map<string, KeyDefinition>,
        scopePrefix = '',
        hopsRemaining = 3,
        visited = new Set<string>()
    ): KeyDefinition {
        if (!keyDef.keyref || hopsRemaining <= 0 || visited.has(keyDef.keyName)) {
            return keyDef;
        }
        visited.add(keyDef.keyName);
        // The @keyref of a key definition is a key reference made in the scope of that definition
        const next = KeySpaceService.lookupKey(keys, keyDef.keyref, scopePrefix);
        if (!next) return keyDef;
        return this.followKeyrefChain(next.def, keys, next.scopePrefix, hopsRemaining - 1, visited);
    }

    /**
     * Like followKeyrefChain but also returns the sequence of key names traversed.
     * chain is empty when no @keyref exists; otherwise lists every visited key name
     * including the final destination.
     */
    private followKeyrefChainWithTrace(
        startDef: KeyDefinition,
        keys: Map<string, KeyDefinition>,
        scopePrefix: string
    ): { def: KeyDefinition; chain: string[] } {
        if (!startDef.keyref) return { def: startDef, chain: [] };

        const chain: string[] = [];
        let current = startDef;
        let currentScope = scopePrefix;
        const visited = new Set<string>();
        let hopsRemaining = 3;

        while (current.keyref && hopsRemaining > 0 && !visited.has(current.keyName)) {
            visited.add(current.keyName);
            chain.push(current.keyName);
            const next = KeySpaceService.lookupKey(keys, current.keyref, currentScope);
            if (!next) break;
            current = next.def;
            currentScope = next.scopePrefix;
            hopsRemaining--;
        }

        // Append final destination only when it differs from the last pushed entry.
        // Without this guard, a self-referential keyref (alias → alias) would produce
        // chain = ["alias", "alias"] with a misleading duplicate.
        if (chain.length > 0 && current.keyName !== chain[chain.length - 1]) {
            chain.push(current.keyName);
        }
        return { def: current, chain };
    }

    /** Append one keyref-hop step per transition in `chain` to `steps`. */
    private appendKeyrefSteps(
        steps: ResolutionStep[],
        chain: string[],
        keys: Map<string, KeyDefinition>
    ): void {
        for (let i = 0; i + 1 < chain.length; i++) {
            const from = chain[i];
            const to = chain[i + 1];
            const def = keys.get(to);
            steps.push({
                type: 'keyref-hop',
                attempted: to,
                found: !!def,
                definition: def,
                note: `Followed @keyref: "${from}" → "${to}"`,
            });
        }
    }

    /**
     * Scan a resolved map for topic hrefs (.dita / .xml) and record the
     * owning scope prefix in topicToScope.  First-seen wins so that topics
     * referenced at root level are not overwritten by a child-scope reference.
     * Topics in the root scope (scopePrefix='') are recorded but leave the
     * context-aware branch in resolveKey() dormant (empty-string check).
     */
    private extractTopicReferences(
        mapContent: string,
        mapPath: string,
        scopePrefix: string,
        topicToScope: Map<string, string>,
        maxMatches: number
    ): void {
        const mapDir = path.dirname(mapPath);
        const topicRefRegex = new RegExp(
            `<(\\w+)\\b${TAG_ATTRS}\\bhref\\s*=\\s*["']([^"'#]+\\.(?:dita|xml))(?:#[^"']*)?["']`,
            'gi'
        );
        let match: RegExpExecArray | null;
        let count = 0;
        while ((match = topicRefRegex.exec(mapContent)) !== null) {
            if (++count > maxMatches) break;
            if (['mapref', 'keydef', 'subjectdef'].includes(match[1].toLowerCase())) continue;
            const href = match[2];
            if (href.startsWith('http://') || href.startsWith('https://')) continue;
            const resolved = path.resolve(mapDir, href);
            if (!this.isPathWithinWorkspace(resolved)) continue;
            const normalized = normalizeFsPath(resolved);
            if (!topicToScope.has(normalized)) {
                topicToScope.set(normalized, scopePrefix);
            }
        }
    }

    private extractMapReferences(
        mapContent: string,
        mapPath: string,
        maxLinkMatches: number
    ): { path: string; keyscopes: string[]; inlineKeys: string[]; isPeer: boolean }[] {
        const submaps: { path: string; keyscopes: string[]; inlineKeys: string[]; isPeer: boolean }[] = [];
        const mapDir = path.dirname(mapPath);
        // Match ANY element with href pointing to a .ditamap or .bookmap file.
        // This covers mapref, topicref, chapter, appendix, part, glossarylist,
        // frontmatter, backmatter, notices, preface, topichead, anchorref, etc.
        // Also capture keyscope attribute for key scope support.
        const mapRefRegex = new RegExp(`<\\w+\\b${TAG_ATTRS}\\bhref\\s*=\\s*["']([^"']+\\.(?:ditamap|bookmap))["']${TAG_ATTRS}>`, 'gi');

        let match: RegExpExecArray | null;
        let matchCount = 0;
        const maxMatches = Math.max(MAX_MAP_REFERENCES, Math.floor(maxLinkMatches / 10));

        while ((match = mapRefRegex.exec(mapContent)) !== null) {
            if (++matchCount > maxMatches) break;

            const href = match[1];
            if (href.startsWith('http://') || href.startsWith('https://')) continue;

            const absolutePath = path.resolve(mapDir, href);
            if (this.isPathWithinWorkspace(absolutePath)) {
                // Extract all keyscope names from the element
                const keyscopeMatch = match[0].match(/\bkeyscope\s*=\s*["']([^"']+)["']/i);
                const keyscopes = keyscopeMatch
                    ? keyscopeMatch[1].split(/\s+/).filter(s => s.length > 0)
                    : [];
                // Capture @keys on the mapref element itself when @keyscope is also present.
                // Per DITA spec, @keys on the same element as @keyscope belong to the child scope.
                const keysMatch = keyscopes.length > 0
                    ? match[0].match(/\bkeys\s*=\s*["']([^"']+)["']/i)
                    : null;
                const inlineKeys = keysMatch
                    ? keysMatch[1].split(/\s+/).filter(k => k.length > 0)
                    : [];
                // A peer map belongs to another publication: its keys are never inlined into
                // this key space. With @keyscope they stay reachable as "scopeName.keyName"
                // (the map is loaded on demand); without one, nothing here can refer to them.
                const scopeMatch = match[0].match(/\bscope\s*=\s*["']([^"']+)["']/i);
                const isPeer = scopeMatch?.[1] === 'peer';
                if (isPeer && keyscopes.length === 0) continue;
                submaps.push({ path: absolutePath, keyscopes, inlineKeys, isPeer });
            }
        }

        return submaps;
    }

    // --- Internal: Caching ---

    private cacheKeySpace(keySpace: KeySpace): void {
        this.cleanupExpiredCacheEntries();

        // LRU eviction
        while (this.keySpaceCache.size >= this.cacheConfig.maxSize) {
            let oldestKey: string | null = null;
            let oldestTime = Infinity;
            for (const [key, space] of this.keySpaceCache.entries()) {
                if (space.buildTime < oldestTime) {
                    oldestTime = space.buildTime;
                    oldestKey = key;
                }
            }
            if (oldestKey) {
                this.keySpaceCache.delete(oldestKey);
            }
        }

        this.keySpaceCache.set(keySpace.rootMap, keySpace);
    }

    private cleanupExpiredCacheEntries(): void {
        const now = Date.now();
        const expired: string[] = [];
        for (const [key, space] of this.keySpaceCache.entries()) {
            if ((now - space.buildTime) > this.cacheConfig.ttlMs) {
                expired.push(key);
            }
        }
        for (const key of expired) this.keySpaceCache.delete(key);
    }

    private cleanupExpiredRootMapCache(): void {
        const now = Date.now();
        for (const cache of [this.rootMapCache, this.rootMapCandidatesCache]) {
            const expired: string[] = [];
            for (const [key, entry] of cache.entries()) {
                if ((now - entry.timestamp) > ROOT_MAP_CACHE_TTL_MS) {
                    expired.push(key);
                }
            }
            for (const key of expired) cache.delete(key);
        }
    }

    private startPeriodicCleanup(): void {
        const interval = Math.max(
            MIN_CLEANUP_INTERVAL_MS,
            this.cacheConfig.ttlMs / CACHE_CLEANUP_RATIO
        );

        this.cleanupTimer = setInterval(() => {
            if (this.keySpaceCache.size === 0 && this.rootMapCache.size === 0 && this.rootMapCandidatesCache.size === 0) return;
            this.cleanupExpiredCacheEntries();
            this.cleanupExpiredRootMapCache();
        }, interval);
    }

    // --- Internal: Helpers ---

    private doInvalidate(changedFile: string, pathChanged: boolean): void {
        const normalizedPath = normalizeFsPath(changedFile);

        // Let in-flight builds detect whether THIS file affects them (scoped
        // staleness check in isBuildStale — unrelated builds keep caching).
        if (this.inFlightBuilds > 0) {
            this.invalidationLog.push(normalizedPath);
        }
        // New callers must not join possibly-stale in-flight builds; the
        // builds themselves still resolve for their current awaiters.
        this.pendingBuilds.clear();

        // Any map change can add or remove the reference that decides which
        // candidate is a file's root map.
        this.rootMapChoiceGeneration++;
        this.rootMapCache.clear();

        if (pathChanged) {
            // A created/deleted/renamed map can alter the candidate root maps
            // of any directory (preferred-name and highest-level rules) —
            // clear the whole cache and fail in-flight lookups.
            // Content edits cannot change the candidates, so they skip this.
            this.cacheGeneration++;
            this.rootMapCandidatesCache.clear();
            // New callers must not join a possibly-stale in-flight lookup;
            // existing awaiters still resolve for their current callers (same
            // shape as pendingBuilds.clear() above for buildKeySpace).
            this.pendingRootMapLookups.clear();
        }

        const toDelete: string[] = [];
        for (const [rootMap, keySpace] of this.keySpaceCache.entries()) {
            if (keySpace.mapHierarchy.some(m => normalizeFsPath(m) === normalizedPath)) {
                toDelete.push(rootMap);
            }
        }
        for (const key of toDelete) this.keySpaceCache.delete(key);
    }

    private isPathWithinWorkspace(absolutePath: string): boolean {
        return isPathWithinWorkspace(absolutePath, this.workspaceFolders);
    }

    /**
     * Register the @keys defined directly on a `<mapref>` element (the
     * mapref itself is included in the child scope it creates, per DITA spec
     * §2.4.4.1) under the given child scope prefixes. Shared between the
     * first traversal of a submap and any later diamond-shaped-scope-graph
     * re-registration under a different scope path.
     */
    private registerInlineMaprefKeys(
        keySpace: KeySpace,
        inlineKeys: string[],
        sourceMap: string,
        targetFile: string,
        childPrefixes: string[]
    ): void {
        if (inlineKeys.length === 0 || childPrefixes.length === 0) return;

        for (const inlineKeyName of inlineKeys) {
            const inlineDef: KeyDefinition = {
                keyName: inlineKeyName,
                sourceMap,
                targetFile,
            };
            // In the child scope only: reachable by scope-qualified names
            for (const prefix of childPrefixes) {
                const qualifiedName = `${prefix}.${inlineKeyName}`;
                this.addScopedKeyEntry(keySpace, qualifiedName, { ...inlineDef, keyName: qualifiedName });
            }
        }
    }

    /**
     * Register a map's already-extracted key definitions under an additional
     * scope-prefix combination reached via a second mapref in a diamond-shaped
     * scope graph (e.g. the same submap included under both @keyscope="prodA"
     * and @keyscope="prodB"). Only populates scope-qualified aliases — the
     * unqualified `keySpace.keys`/`duplicateKeys` bookkeeping already happened
     * when the map was first traversed and must not be repeated here.
     */
    private registerKeysForAdditionalScope(
        keySpace: KeySpace,
        keys: KeyDefinition[],
        scopePrefixes: string[],
        rootScopes: string[]
    ): void {
        const effectivePrefixes = this.combineScopePrefixes(scopePrefixes, rootScopes);
        if (effectivePrefixes.length === 0) return;

        for (const keyDef of keys) {
            for (const prefix of effectivePrefixes) {
                const qualifiedName = `${prefix}.${keyDef.keyName}`;
                this.addScopedKeyEntry(keySpace, qualifiedName, { ...keyDef, keyName: qualifiedName });
            }
        }
    }

    /**
     * Compute the cross product of parent scope prefixes and child scope names.
     * - If childScopes is empty, returns parentPrefixes unchanged (scope is inherited).
     * - If parentPrefixes is empty, returns childScopes as new prefixes.
     * - Otherwise returns every "parent.child" combination.
     * Uses a Set internally to deduplicate (handles diamond-shaped scope graphs).
     */
    private combineScopePrefixes(parentPrefixes: string[], childScopes: string[]): string[] {
        if (childScopes.length === 0) return parentPrefixes;
        if (parentPrefixes.length === 0) return childScopes;
        const combined = new Set<string>();
        for (const parent of parentPrefixes) {
            for (const child of childScopes) {
                combined.add(`${parent}.${child}`);
            }
        }
        return Array.from(combined);
    }

    /**
     * Insert a scope-qualified alias entry only when the key space has not yet
     * reached the combinatorial explosion cap.  Always a no-op when the name
     * already exists (first-definition wins).
     */
    private addScopedKeyEntry(
        keySpace: KeySpace,
        qualifiedName: string,
        def: KeyDefinition
    ): void {
        if (keySpace.keys.has(qualifiedName)) return;
        if (keySpace.keys.size >= MAX_KEY_SPACE_ENTRIES) {
            keySpace.scopeExplosionWarning = true;
            return;
        }
        keySpace.keys.set(qualifiedName, def);
    }

    /** Return the 1-based line number for `charIndex` within `content`. */
    private computeLineNumber(content: string, charIndex: number): number {
        let line = 1;
        const end = Math.min(charIndex, content.length);
        for (let i = 0; i < end; i++) {
            if (content[i] === '\n') line++;
        }
        return line;
    }

    // --- Internal: inline scope branch handling ---

    /**
     * Find all top-level elements within `content` that carry @keyscope but do NOT
     * reference an external .ditamap/.bookmap file.  These are "inline scope branches"
     * whose child key definitions must be processed under the child scope prefix.
     *
     * Only top-level blocks are returned; nested ones are found recursively in
     * processInlineScopeBlocks so they are never double-processed.
     */
    private extractInlineScopeBlocks(content: string): Array<{
        keyscopes: string[];
        inlineKeys: string[];
        innerContent: string;
        outerStart: number;
        outerEnd: number;
    }> {
        const blocks: Array<{
            keyscopes: string[];
            inlineKeys: string[];
            innerContent: string;
            outerStart: number;
            outerEnd: number;
        }> = [];

        const keyscopedRe = new RegExp(
            `<(\\w+)\\b${TAG_ATTRS}\\bkeyscope\\s*=\\s*["']([^"']+)["']${TAG_ATTRS}>`,
            'gi'
        );

        let match: RegExpExecArray | null;
        while ((match = keyscopedRe.exec(content)) !== null) {
            const fullOpenTag = match[0];
            const elemName = match[1];

            // Root map/bookmap keyscopes are handled by extractRootKeyscope
            if (/^(?:map|bookmap)$/i.test(elemName)) continue;
            // Submap references are handled by extractMapReferences + inlineKeys mechanism
            if (/\bhref\s*=\s*["'][^"']*\.(?:ditamap|bookmap)["']/i.test(fullOpenTag)) continue;
            // Self-closing elements have no children to scope
            if (fullOpenTag.endsWith('/>')) continue;

            const openTagEnd = match.index + fullOpenTag.length;
            const inner = this.findInnerContent(content, openTagEnd, elemName);
            if (!inner) continue;

            const keyscopes = match[2].split(/\s+/).filter(s => s.length > 0);
            const keysMatch = fullOpenTag.match(/\bkeys\s*=\s*["']([^"']+)["']/i);
            const inlineKeys = keysMatch
                ? keysMatch[1].split(/\s+/).filter(k => k.length > 0)
                : [];

            blocks.push({
                keyscopes,
                inlineKeys,
                // At its place in the map, the rest blanked: offsets and lines are the map's
                innerContent: blankOutside(content, openTagEnd, openTagEnd + inner.content.length),
                outerStart: match.index,
                outerEnd: inner.end,
            });
        }

        // Keep only top-level blocks; nested blocks are handled by recursion.
        return blocks.filter(block =>
            !blocks.some(
                other =>
                    other !== block &&
                    other.outerStart < block.outerStart &&
                    block.outerEnd <= other.outerEnd
            )
        );
    }

    /**
     * Given a position immediately after an element's opening tag, find the matching
     * closing tag and return the inner content and the end position of the close tag.
     * Handles nesting of same-name elements correctly via a depth counter.
     */
    private findInnerContent(
        content: string,
        fromIndex: number,
        tagName: string
    ): { content: string; end: number } | null {
        const escapedTag = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const openRe = new RegExp(`<${escapedTag}\\b`, 'gi');
        const closeRe = new RegExp(`<\\/${escapedTag}\\s*>`, 'gi');

        let depth = 1;
        let pos = fromIndex;

        while (depth > 0 && pos < content.length) {
            openRe.lastIndex = pos;
            closeRe.lastIndex = pos;
            const nextOpen = openRe.exec(content);
            const nextClose = closeRe.exec(content);

            if (!nextClose) return null; // Malformed XML

            if (nextOpen && nextOpen.index < nextClose.index) {
                // Scan forward to the closing '>' of this opening tag to determine
                // whether it's self-closing (ends with '/>').  Self-closing elements
                // don't introduce a new nesting level.
                let scanPos = nextOpen.index + nextOpen[0].length;
                let inAttrQuote = false;
                let quoteChar = '';
                while (scanPos < content.length) {
                    const ch = content[scanPos];
                    if (inAttrQuote) {
                        if (ch === quoteChar) inAttrQuote = false;
                    } else if (ch === '"' || ch === "'") {
                        inAttrQuote = true;
                        quoteChar = ch;
                    } else if (ch === '>') {
                        break;
                    }
                    scanPos++;
                }
                // Check for self-closing: '>' preceded by '/' (ignoring whitespace)
                let checkPos = scanPos - 1;
                while (checkPos > nextOpen.index && /\s/.test(content[checkPos])) checkPos--;
                if (content[checkPos] !== '/') depth++;
                pos = scanPos + 1;
            } else {
                depth--;
                if (depth === 0) {
                    return {
                        content: content.substring(fromIndex, nextClose.index),
                        end: nextClose.index + nextClose[0].length,
                    };
                }
                pos = nextClose.index + nextClose[0].length;
            }
        }
        return null;
    }

    /**
     * Replace character ranges with spaces to prevent re-processing.
     * Preserves string length so that regex lastIndex values in the original
     * content remain valid after masking.
     */
    private maskRanges(
        content: string,
        ranges: Array<{ start: number; end: number }>
    ): string {
        if (ranges.length === 0) return content;
        const sorted = [...ranges].sort((a, b) => a.start - b.start);
        let result = '';
        let pos = 0;
        for (const { start, end } of sorted) {
            if (start > pos) result += content.substring(pos, start);
            // Blank, keeping line breaks: the lines after the range keep their numbers
            const from = Math.max(start, pos);
            if (end > from) result += content.substring(from, end).replace(/[^\r\n]/g, ' ');
            pos = Math.max(pos, end);
        }
        result += content.substring(pos);
        return result;
    }

    /**
     * Recursively process inline scope branches within map content.
     *
     * For each top-level element with @keyscope (but no external map href):
     *   1. Compute child scope prefixes.
     *   2. Register any @keys on the scope element itself in the child scope.
     *   3. Recurse into the block's inner content (handles nesting).
     *   4. Extract key definitions and topic references from the inner content
     *      and register them under child scope prefixes.
     *   5. Discover submaps inside the block and push them onto bfsQueue with
     *      the appropriate child scope prefixes.
     *
     * Returns the input content with all inline scope block ranges replaced by
     * spaces so the caller's extractKeyDefinitions / extractTopicReferences /
     * extractMapReferences calls do not double-count child-scope content.
     */
    private processInlineScopeBlocks(
        content: string,
        mapPath: string,
        parentEffectivePrefixes: string[],
        keySpace: KeySpace,
        bfsQueue: Array<{ mapPath: string; scopePrefixes: string[] }>,
        maxLinkMatches: number,
        depth = 0
    ): string {
        if (depth > MAX_INLINE_SCOPE_DEPTH) return content;

        const blocks = this.extractInlineScopeBlocks(content);
        if (blocks.length === 0) return content;

        const maskedContent = this.maskRanges(
            content,
            blocks.map(b => ({ start: b.outerStart, end: b.outerEnd }))
        );

        for (const block of blocks) {
            const childPrefixes = this.combineScopePrefixes(parentEffectivePrefixes, block.keyscopes);
            if (childPrefixes.length === 0) continue;

            // @keys on the scope-creating element itself belong to the child scope (DITA §2.4.4.1)
            for (const inlineKeyName of block.inlineKeys) {
                const inlineDef: KeyDefinition = { keyName: inlineKeyName, sourceMap: mapPath };
                for (const prefix of childPrefixes) {
                    const qualifiedName = `${prefix}.${inlineKeyName}`;
                    this.addScopedKeyEntry(keySpace, qualifiedName, { ...inlineDef, keyName: qualifiedName });
                }
            }

            // Recurse into nested inline scopes; receive inner content with those sub-blocks masked
            const maskedBlockContent = this.processInlineScopeBlocks(
                block.innerContent, mapPath, childPrefixes,
                keySpace, bfsQueue, maxLinkMatches, depth + 1
            );

            // Register key definitions from the (masked) block content under the child scope:
            // reachable by scope-qualified names only. (Keys defined twice inside the block are
            // found in the map's text by the cross-reference validation.)
            const blockKeys = this.extractKeyDefinitions(maskedBlockContent, mapPath, maxLinkMatches);
            for (const keyDef of blockKeys) {
                for (const prefix of childPrefixes) {
                    const qualifiedName = `${prefix}.${keyDef.keyName}`;
                    this.addScopedKeyEntry(keySpace, qualifiedName, { ...keyDef, keyName: qualifiedName });
                }
            }

            // Register topic-scope associations for context-aware resolution
            this.extractTopicReferences(
                maskedBlockContent, mapPath, childPrefixes[0], keySpace.topicToScope, maxLinkMatches
            );

            // Discover submaps inside this block and queue with combined scope prefix
            const blockSubmaps = this.extractMapReferences(maskedBlockContent, mapPath, maxLinkMatches);
            for (const submap of blockSubmaps) {
                if (submap.isPeer) {
                    for (const scopeName of submap.keyscopes) {
                        if (!keySpace.deferredPeerMaps.has(scopeName)) {
                            keySpace.deferredPeerMaps.set(scopeName, submap.path);
                        }
                    }
                    continue;
                }
                const grandchildPrefixes = this.combineScopePrefixes(childPrefixes, submap.keyscopes);
                if (submap.inlineKeys.length > 0 && grandchildPrefixes.length > 0) {
                    for (const inlineKeyName of submap.inlineKeys) {
                        const inlineDef: KeyDefinition = {
                            keyName: inlineKeyName,
                            sourceMap: mapPath,
                            targetFile: submap.path,
                        };
                        for (const prefix of grandchildPrefixes) {
                            const qualifiedName = `${prefix}.${inlineKeyName}`;
                            this.addScopedKeyEntry(keySpace, qualifiedName, { ...inlineDef, keyName: qualifiedName });
                        }
                    }
                }
                bfsQueue.push({ mapPath: submap.path, scopePrefixes: grandchildPrefixes });
            }
        }

        return maskedContent;
    }

    /**
     * Remove `<reltable>` blocks from map content before key-space extraction.
     * Relationship tables define topic relationships, not key definitions; their
     * hrefs must not pollute the key space or topicToScope (DITA spec §2.4.4).
     */
    private stripReltables(content: string): string {
        // Blank rather than delete: deleting would shift every subsequent line
        // number (offsets computed against this content, e.g. sourceLine in
        // extractKeyDefinitionsFromElements, would then undercount for any
        // keydef appearing after a <reltable> — mirrors the blank-but-preserve-
        // length approach stripCommentsAndCDATA already uses for this exact
        // reason).
        return content.replace(
            /<reltable\b[^>]*>[\s\S]*?<\/reltable\s*>/gi,
            (m) => m.replace(/[^\n\r]/g, ' ')
        );
    }

    /** Extract keyscope(s) from the root map/bookmap element. */
    private extractRootKeyscope(mapContent: string): string[] {
        const rootMatch = mapContent.match(new RegExp(`<(?:map|bookmap)\\b(${TAG_ATTRS})`, 'i'));
        if (!rootMatch) return [];
        const keyscopeMatch = rootMatch[1].match(/\bkeyscope\s*=\s*["']([^"']+)["']/i);
        return keyscopeMatch ? keyscopeMatch[1].split(/\s+/).filter(s => s.length > 0) : [];
    }

    /** Check if a map file is a subject scheme map (root element is <subjectScheme>). */
    private isSubjectSchemeMap(rawContent: string): boolean {
        // Strip XML declaration and DOCTYPE, then check root element
        const stripped = rawContent
            .replace(/<\?xml[^?]*\?>/g, '')
            .replace(/<!DOCTYPE[^>]*>/g, '')
            .replace(/<!--[\s\S]*?-->/g, '')
            .trimStart();
        return /^<subjectScheme\b/i.test(stripped);
    }

    private async fileExistsAsync(filePath: string): Promise<boolean> {
        try {
            await fsPromises.access(filePath, fs.constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }
}

// ---------------------------------------------------------------------------
// Standalone reporting utilities
// ---------------------------------------------------------------------------

/**
 * Produce a human-readable text report of an entire key space.
 * Lists keys by scope, highlights duplicates and deferred peer maps.
 */
export function reportKeySpace(keySpace: KeySpace): string {
    const lines: string[] = [];
    lines.push(`Key Space Report: ${keySpace.rootMap}`);
    lines.push(`  Built: ${new Date(keySpace.buildTime).toISOString()}`);
    lines.push(`  Maps processed: ${keySpace.mapHierarchy.length}`);
    lines.push(`  Total keys: ${keySpace.keys.size}`);
    if (keySpace.scopeExplosionWarning) {
        lines.push(`  WARNING: Scope explosion cap reached — some qualified aliases were dropped`);
    }

    // Group entries by their outermost scope prefix (text before first dot, or '' for root).
    const byScope = new Map<string, Array<[string, KeyDefinition]>>();
    for (const [name, def] of keySpace.keys) {
        const dotIdx = name.indexOf('.');
        const scope = dotIdx > 0 ? name.slice(0, dotIdx) : '';
        if (!byScope.has(scope)) byScope.set(scope, []);
        byScope.get(scope)!.push([name, def]);
    }

    lines.push('');
    lines.push('Keys by scope:');
    for (const scope of Array.from(byScope.keys()).sort()) {
        lines.push(`  [${scope || 'root'}]`);
        const entries = byScope.get(scope)!.sort((a, b) => a[0].localeCompare(b[0]));
        for (const [name, def] of entries) {
            const target = describeKeyTarget(def);
            const lineSuffix = def.sourceLine ? `:${def.sourceLine}` : '';
            const keyrefSuffix = def.keyref ? ` → keyref:${def.keyref}` : '';
            lines.push(`    ${name} → ${target}  [${path.basename(def.sourceMap)}${lineSuffix}]${keyrefSuffix}`);
        }
    }

    if (keySpace.duplicateKeys.size > 0) {
        lines.push('');
        lines.push(`Duplicate keys (${keySpace.duplicateKeys.size}):`);
        for (const [name, defs] of keySpace.duplicateKeys) {
            lines.push(`  ${name}  (${defs.length} definitions, first wins):`);
            defs.forEach((d, i) => {
                const lineSuffix = d.sourceLine ? `:${d.sourceLine}` : '';
                const status = i === 0 ? 'effective' : 'shadowed';
                lines.push(`    [${status}]  ${path.basename(d.sourceMap)}${lineSuffix}`);
            });
        }
    }

    if (keySpace.deferredPeerMaps.size > 0) {
        lines.push('');
        lines.push(`Deferred peer maps (${keySpace.deferredPeerMaps.size}):`);
        for (const [scope, mapPath] of keySpace.deferredPeerMaps) {
            lines.push(`  ${scope} → ${path.basename(mapPath)}`);
        }
    }

    return lines.join('\n');
}

/**
 * Render a KeyResolutionReport as human-readable text.
 * Suitable for hover tooltips, hover documentation, or debug output.
 */
export function formatResolutionReport(report: KeyResolutionReport): string {
    const lines: string[] = [];
    const status = report.resolvedDefinition ? 'RESOLVED' : 'NOT FOUND';
    lines.push(`Key resolution: "${report.keyName}"  [${status}]`);

    if (report.contextScope) {
        lines.push(`  Context scope: ${report.contextScope}`);
    }

    if (report.resolvedDefinition) {
        const def = report.resolvedDefinition;
        const target = describeKeyTarget(def);
        const lineSuffix = def.sourceLine ? `:${def.sourceLine}` : '';
        lines.push(`  Winner: ${target}  [${path.basename(def.sourceMap)}${lineSuffix}]`);
    }

    if (report.keyrefChain.length > 0) {
        lines.push(`  Keyref chain: ${report.keyrefChain.join(' → ')}`);
    }

    lines.push('  Steps:');
    for (const step of report.steps) {
        const tick = step.found ? '✓' : '✗';
        lines.push(`    ${tick} [${step.type}]  ${step.note}`);
    }

    return lines.join('\n');
}
