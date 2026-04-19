/**
 * Server-side Key Space Service.
 * Resolves DITA key references by building a key space from map hierarchies.
 * Ported from client-side src/utils/keySpaceResolver.ts with VS Code
 * dependencies replaced by injected callbacks.
 */

import * as path from 'path';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';

import { TAG_ATTRS } from '../utils/patterns';
import { stripCommentsAndCDATA } from '../utils/textUtils';
import { IKeySpaceService } from './interfaces';

// --- Interfaces ---

export interface KeyDefinition {
    keyName: string;
    targetFile?: string;
    elementId?: string;
    inlineContent?: string;
    sourceMap: string;
    scope?: string;
    processingRole?: string;
    /** Indirect key reference: when set, resolution follows the chain to this key name. */
    keyref?: string;
    metadata?: KeyMetadata;
}

export interface KeyMetadata {
    navtitle?: string;
    keywords?: string[];
    shortdesc?: string;
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
     * Used by resolveKey() to perform context-aware scope lookup before
     * falling back to the flat unqualified key name.
     */
    topicToScope: Map<string, string>;
}

interface CacheConfig {
    ttlMs: number;
    maxSize: number;
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
const ROOT_MAP_CACHE_TTL_MS = ONE_MINUTE_MS;
const FILE_WATCHER_DEBOUNCE_MS = 300;
const MIN_CLEANUP_INTERVAL_MS = 5 * ONE_MINUTE_MS;
const CACHE_CLEANUP_RATIO = 3;

// --- Service ---

export class KeySpaceService implements IKeySpaceService {
    private workspaceFolders: string[];
    private getSettings: () => Promise<KeySpaceSettings>;
    private log: (msg: string) => void;

    private keySpaceCache: Map<string, KeySpace> = new Map();
    private rootMapCache: Map<string, { rootMap: string | null; timestamp: number }> = new Map();
    private cacheConfig: CacheConfig;
    private pendingBuilds: Map<string, Promise<KeySpace>> = new Map();
    private debounceTimer: ReturnType<typeof setTimeout> | undefined;
    private pendingInvalidations: Set<string> = new Set();
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
     * Set an explicit root map path, overriding auto-discovery.
     * Pass null to revert to auto-discovery.
     */
    public setExplicitRootMap(rootMapPath: string | null): void {
        this.explicitRootMapPath = rootMapPath;
        // Clear both caches so findRootMap uses the new explicit path
        // and key space is rebuilt from the new root map
        this.rootMapCache.clear();
        this.keySpaceCache.clear();
    }

    /** Get the current explicit root map path (null if auto-discovering). */
    public getExplicitRootMap(): string | null {
        return this.explicitRootMapPath;
    }

    /**
     * Resolve a key name to its definition.
     * Finds the root map, builds (or retrieves cached) key space, then looks up key.
     */
    public async resolveKey(
        keyName: string,
        contextFilePath: string
    ): Promise<KeyDefinition | null> {
        const rootMap = await this.findRootMap(contextFilePath);
        if (!rootMap) {
            return null;
        }

        const keySpace = await this.buildKeySpace(rootMap);

        // Context-aware resolution: when the authoring file lives inside a named
        // scope, prefer the scope-qualified key (e.g. "product.lib.version") over
        // the root-level unqualified key ("version").  The PushDown pass has already
        // added inherited ancestor keys under the child scope namespace, so a child
        // scope override always beats an ancestor definition at this lookup point.
        const scopePrefix = keySpace.topicToScope.get(path.normalize(contextFilePath));
        if (scopePrefix) {
            const qualifiedName = `${scopePrefix}.${keyName}`;
            const scopedDef = keySpace.keys.get(qualifiedName);
            if (scopedDef) {
                return this.followKeyrefChain(scopedDef, keySpace.keys, scopePrefix);
            }
        }

        // Fall back to the context-free (root-scope) entry.
        const keyDef = keySpace.keys.get(keyName) ?? null;
        if (keyDef) {
            return this.followKeyrefChain(keyDef, keySpace.keys, '');
        }
        return null;
    }

    /**
     * Returns all keys from the key space for the given context file.
     * Finds the root map, builds (or retrieves cached) key space, then returns all keys.
     * Used by completion to offer all available key names.
     */
    public async getAllKeys(
        contextFilePath: string
    ): Promise<Map<string, KeyDefinition>> {
        const rootMap = await this.findRootMap(contextFilePath);
        if (!rootMap) {
            return new Map();
        }

        const keySpace = await this.buildKeySpace(rootMap);
        return keySpace.keys;
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

        const buildPromise = this.doBuildKeySpace(absoluteRootPath);
        this.pendingBuilds.set(absoluteRootPath, buildPromise);

        try {
            return await buildPromise;
        } finally {
            this.pendingBuilds.delete(absoluteRootPath);
        }
    }

    /**
     * Find root map for a given file by searching upward through directories.
     * If an explicit root map is set via setExplicitRootMap(), it is always returned.
     * Priority: root.ditamap > main.ditamap > master.ditamap > first alphabetically.
     */
    public async findRootMap(filePath: string): Promise<string | null> {
        // Explicit root map overrides auto-discovery
        if (this.explicitRootMapPath) {
            return this.explicitRootMapPath;
        }

        const absolutePath = path.isAbsolute(filePath)
            ? filePath
            : path.resolve(filePath);

        const cacheKey = path.dirname(absolutePath);

        // Check cache
        const cached = this.rootMapCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < ROOT_MAP_CACHE_TTL_MS) {
            return cached.rootMap;
        }

        let currentDir = path.dirname(absolutePath);
        const stopDir = this.workspaceFolders[0] || path.parse(currentDir).root;

        // Search all the way up to workspace root.
        // Root maps are typically at the project root, so prefer maps at
        // the highest level (closest to workspace root).
        const preferredNames = ['root.ditamap', 'main.ditamap', 'master.ditamap'];
        let bestMap: string | null = null;

        while (currentDir && currentDir.length >= stopDir.length) {
            try {
                const files = await fsPromises.readdir(currentDir);
                const mapFiles = files.filter(f =>
                    f.endsWith('.ditamap') || f.endsWith('.bookmap')
                );

                if (mapFiles.length > 0) {
                    let found: string | null = null;

                    for (const preferred of preferredNames) {
                        if (mapFiles.includes(preferred)) {
                            found = path.join(currentDir, preferred);
                            break;
                        }
                    }

                    if (!found) {
                        found = path.join(currentDir, mapFiles.sort()[0]);
                    }

                    // Higher directories overwrite lower — root maps live at project root
                    bestMap = found;
                }
            } catch {
                // Directory not readable
            }

            const parentDir = path.dirname(currentDir);
            if (parentDir === currentDir) break;
            currentDir = parentDir;
        }

        this.rootMapCache.set(cacheKey, { rootMap: bestMap, timestamp: Date.now() });
        return bestMap;
    }

    /** Invalidate cache entries for a changed file. */
    public invalidateForFile(changedFile: string): void {
        this.pendingInvalidations.add(changedFile);

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        this.debounceTimer = setTimeout(() => {
            for (const file of this.pendingInvalidations) {
                this.doInvalidate(file);
            }
            this.pendingInvalidations.clear();
            this.debounceTimer = undefined;
        }, FILE_WATCHER_DEBOUNCE_MS);
    }

    /** Update workspace folders (on workspace change events). */
    public updateWorkspaceFolders(added: string[], removed: string[]): void {
        for (const r of removed) {
            const idx = this.workspaceFolders.indexOf(r);
            if (idx >= 0) this.workspaceFolders.splice(idx, 1);
        }
        this.workspaceFolders.push(...added);

        // Invalidate all caches since workspace context changed
        this.keySpaceCache.clear();
        this.rootMapCache.clear();
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

        // Tracks the highest-priority key definition per key name per scope prefix.
        // The PushDown pass uses this to propagate ancestor-scope keys into
        // descendant scope namespaces (e.g. "product.lib.version" from "product.version").
        const scopeDirectKeys = new Map<string, KeyDefinition[]>();

        while (queue.length > 0) {
            const { mapPath: currentMap, scopePrefixes } = queue.shift()!;
            const normalizedPath = path.normalize(currentMap);

            if (visited.has(normalizedPath)) continue;

            const fileExists = await this.fileExistsAsync(currentMap);
            if (!fileExists) continue;

            visited.add(normalizedPath);
            keySpace.mapHierarchy.push(currentMap);

            try {
                const rawContent = await fsPromises.readFile(currentMap, 'utf-8');
                // Strip comments/CDATA first, then reltable blocks.
                // reltable hrefs are relationship-table links — not key-space content (spec §2.4.4).
                const mapContent = this.stripReltables(stripCommentsAndCDATA(rawContent));

                const rootScopes = this.extractRootKeyscope(mapContent);
                const effectivePrefixes = this.combineScopePrefixes(scopePrefixes, rootScopes);
                // The primary prefix is the first (canonical) scope path for this map,
                // used for topic-to-scope tracking.  All prefixes (multi-name keyscope)
                // are used for scopeDirectKeys so PushDown inheritance works for every alias.
                const primaryPrefix = effectivePrefixes[0] ?? '';
                const allScopePrefixes = effectivePrefixes.length > 0 ? effectivePrefixes : [''];

                for (const prefix of allScopePrefixes) {
                    if (!scopeDirectKeys.has(prefix)) {
                        scopeDirectKeys.set(prefix, []);
                    }
                }

                // Handle inline scope branches (topicrefs with @keyscope that don't
                // reference an external map).  Returns mapContent with those blocks
                // blanked out so that child-scope keys are not re-processed here.
                const maskedContent = this.processInlineScopeBlocks(
                    mapContent, currentMap, effectivePrefixes,
                    keySpace, scopeDirectKeys, queue, maxLinkMatches
                );

                const keys = this.extractKeyDefinitions(maskedContent, currentMap, maxLinkMatches);
                for (const keyDef of keys) {
                    // Record as a direct key of every scope alias (first per key name wins).
                    for (const prefix of allScopePrefixes) {
                        const directKeys = scopeDirectKeys.get(prefix)!;
                        if (!directKeys.some(k => k.keyName === keyDef.keyName)) {
                            directKeys.push(keyDef);
                        }
                    }

                    // Unqualified entry — first definition across the whole key space wins.
                    if (!keySpace.keys.has(keyDef.keyName)) {
                        keySpace.keys.set(keyDef.keyName, keyDef);
                    } else {
                        let dups = keySpace.duplicateKeys.get(keyDef.keyName);
                        if (!dups) {
                            dups = [keySpace.keys.get(keyDef.keyName)!];
                            keySpace.duplicateKeys.set(keyDef.keyName, dups);
                        }
                        dups.push(keyDef);
                    }

                    // Scope-qualified entries — first definition per qualified name wins.
                    for (const prefix of effectivePrefixes) {
                        const qualifiedName = `${prefix}.${keyDef.keyName}`;
                        if (!keySpace.keys.has(qualifiedName)) {
                            keySpace.keys.set(qualifiedName, { ...keyDef, keyName: qualifiedName });
                        }
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
                for (const submap of submaps) {
                    const childPrefixes = this.combineScopePrefixes(effectivePrefixes, submap.keyscopes);

                    // Register @keys defined on the mapref element itself under the child scope prefix.
                    // The mapref element is included in the child scope it creates (DITA spec §2.4.4.1).
                    if (submap.inlineKeys.length > 0 && childPrefixes.length > 0) {
                        for (const inlineKeyName of submap.inlineKeys) {
                            const inlineDef: KeyDefinition = {
                                keyName: inlineKeyName,
                                sourceMap: currentMap,
                                targetFile: submap.path,
                            };
                            for (const prefix of childPrefixes) {
                                if (!scopeDirectKeys.has(prefix)) {
                                    scopeDirectKeys.set(prefix, []);
                                }
                                const directKeys = scopeDirectKeys.get(prefix)!;
                                if (!directKeys.some(k => k.keyName === inlineKeyName)) {
                                    directKeys.push(inlineDef);
                                }
                                const qualifiedName = `${prefix}.${inlineKeyName}`;
                                if (!keySpace.keys.has(qualifiedName)) {
                                    keySpace.keys.set(qualifiedName, { ...inlineDef, keyName: qualifiedName });
                                }
                            }
                            if (!keySpace.keys.has(inlineKeyName)) {
                                keySpace.keys.set(inlineKeyName, inlineDef);
                            }
                        }
                    }

                    queue.push({ mapPath: submap.path, scopePrefixes: childPrefixes });
                }
            } catch {
                // Error reading/parsing map, skip
            }
        }

        // PushDown pass: for every child scope, inherit ancestor-scope key definitions
        // at lower priority.  This ensures that a key defined in an ancestor scope (e.g.
        // "product.version") is resolvable via its fully-qualified child-scope name (e.g.
        // "product.lib.version") when authoring within the "lib" child scope.
        // Keys already defined in the child scope (added during BFS) are not overwritten.
        for (const [childPrefix] of scopeDirectKeys) {
            if (childPrefix === '') continue;
            const parts = childPrefix.split('.');
            // Walk ancestor depths from root (depth=0 → '') up to the immediate parent.
            for (let depth = 0; depth < parts.length; depth++) {
                const ancestorPrefix = parts.slice(0, depth).join('.');
                for (const ancestorKey of scopeDirectKeys.get(ancestorPrefix) ?? []) {
                    const inheritedName = `${childPrefix}.${ancestorKey.keyName}`;
                    if (!keySpace.keys.has(inheritedName)) {
                        keySpace.keys.set(inheritedName, { ...ancestorKey, keyName: inheritedName });
                    }
                }
            }
        }

        this.log(`Key space built: ${keySpace.keys.size} keys from ${keySpace.mapHierarchy.length} maps`);
        this.cacheKeySpace(keySpace);
        return keySpace;
    }

    // --- Internal: Key extraction ---

    private extractKeyDefinitions(
        mapContent: string,
        mapPath: string,
        maxMatches: number
    ): KeyDefinition[] {
        const keys: KeyDefinition[] = [];
        const mapDir = path.dirname(mapPath);

        const keydefRegex = new RegExp(`<(\\w+)\\b${TAG_ATTRS}\\bkeys\\s*=\\s*["']([^"']+)["']${TAG_ATTRS}>`, 'gi');
        let match: RegExpExecArray | null;
        let matchCount = 0;

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

            for (const keyName of keyNames) {
                const keyDef: KeyDefinition = {
                    keyName,
                    sourceMap: mapPath,
                };

                // Extract href
                const hrefMatch = fullElement.match(/\bhref\s*=\s*["']([^"']+)["']/i);
                if (hrefMatch) {
                    const href = hrefMatch[1];
                    if (href.includes('#')) {
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
                    } else if (!href.startsWith('http://') && !href.startsWith('https://')) {
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
        if (keywordsBlockMatch) {
            const kwContent = keywordsBlockMatch[1];
            const kwRegex = /<keyword\b[^>]*>([^<]+)<\/keyword>/gi;
            const keywords: string[] = [];
            let kwMatch: RegExpExecArray | null;
            while ((kwMatch = kwRegex.exec(kwContent)) !== null) {
                keywords.push(kwMatch[1].trim());
            }
            if (keywords.length > 0) {
                metadata.keywords = keywords;
                // First keyword is the inline content
                inlineContent = keywords[0];
            }
        }

        // Fallback: keyword directly in topicmeta (without <keywords> wrapper)
        if (!inlineContent) {
            const directKwMatch = metaContent.match(/<keyword\b[^>]*>([^<]+)<\/keyword>/i);
            if (directKwMatch) {
                inlineContent = directKwMatch[1].trim();
                if (!metadata.keywords) {
                    metadata.keywords = [inlineContent];
                }
            }
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
        // Prefer the scope-qualified target so that keyref chains within a named
        // scope resolve to the scope's own override rather than the root definition.
        const next = (scopePrefix ? keys.get(`${scopePrefix}.${keyDef.keyref}`) : undefined)
            ?? keys.get(keyDef.keyref);
        if (!next) return keyDef;
        return this.followKeyrefChain(next, keys, scopePrefix, hopsRemaining - 1, visited);
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
            const normalized = path.normalize(resolved);
            if (!topicToScope.has(normalized)) {
                topicToScope.set(normalized, scopePrefix);
            }
        }
    }

    private extractMapReferences(
        mapContent: string,
        mapPath: string,
        maxLinkMatches: number
    ): { path: string; keyscopes: string[]; inlineKeys: string[] }[] {
        const submaps: { path: string; keyscopes: string[]; inlineKeys: string[] }[] = [];
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
                submaps.push({ path: absolutePath, keyscopes, inlineKeys });
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
        const expired: string[] = [];
        for (const [key, entry] of this.rootMapCache.entries()) {
            if ((now - entry.timestamp) > ROOT_MAP_CACHE_TTL_MS) {
                expired.push(key);
            }
        }
        for (const key of expired) this.rootMapCache.delete(key);
    }

    private startPeriodicCleanup(): void {
        const interval = Math.max(
            MIN_CLEANUP_INTERVAL_MS,
            this.cacheConfig.ttlMs / CACHE_CLEANUP_RATIO
        );

        this.cleanupTimer = setInterval(() => {
            if (this.keySpaceCache.size === 0 && this.rootMapCache.size === 0) return;
            this.cleanupExpiredCacheEntries();
            this.cleanupExpiredRootMapCache();
        }, interval);
    }

    // --- Internal: Helpers ---

    private doInvalidate(changedFile: string): void {
        const normalizedPath = path.normalize(changedFile);
        const changedDir = path.dirname(normalizedPath);

        this.rootMapCache.delete(changedDir);

        const toDelete: string[] = [];
        for (const [rootMap, keySpace] of this.keySpaceCache.entries()) {
            if (keySpace.mapHierarchy.some(m => path.normalize(m) === normalizedPath)) {
                toDelete.push(rootMap);
            }
        }
        for (const key of toDelete) this.keySpaceCache.delete(key);
    }

    private isPathWithinWorkspace(absolutePath: string): boolean {
        if (this.workspaceFolders.length === 0) {
            return true; // No workspace — single file mode
        }

        const normalizedPath = path.normalize(absolutePath);
        return this.workspaceFolders.some(folder => {
            const normalizedWorkspace = path.normalize(folder);
            return normalizedPath.startsWith(normalizedWorkspace + path.sep);
        });
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
                innerContent: inner.content,
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
            result += ' '.repeat(Math.max(0, end - start));
            pos = end;
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
        scopeDirectKeys: Map<string, KeyDefinition[]>,
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

            for (const prefix of childPrefixes) {
                if (!scopeDirectKeys.has(prefix)) scopeDirectKeys.set(prefix, []);
            }

            // @keys on the scope-creating element itself belong to the child scope (DITA §2.4.4.1)
            for (const inlineKeyName of block.inlineKeys) {
                const inlineDef: KeyDefinition = { keyName: inlineKeyName, sourceMap: mapPath };
                for (const prefix of childPrefixes) {
                    const directKeys = scopeDirectKeys.get(prefix)!;
                    if (!directKeys.some(k => k.keyName === inlineKeyName)) directKeys.push(inlineDef);
                    const qualifiedName = `${prefix}.${inlineKeyName}`;
                    if (!keySpace.keys.has(qualifiedName)) {
                        keySpace.keys.set(qualifiedName, { ...inlineDef, keyName: qualifiedName });
                    }
                }
                if (!keySpace.keys.has(inlineKeyName)) keySpace.keys.set(inlineKeyName, inlineDef);
            }

            // Recurse into nested inline scopes; receive inner content with those sub-blocks masked
            const maskedBlockContent = this.processInlineScopeBlocks(
                block.innerContent, mapPath, childPrefixes,
                keySpace, scopeDirectKeys, bfsQueue, maxLinkMatches, depth + 1
            );

            // Register key definitions from the (masked) block content under child scope
            const blockKeys = this.extractKeyDefinitions(maskedBlockContent, mapPath, maxLinkMatches);
            for (const keyDef of blockKeys) {
                for (const prefix of childPrefixes) {
                    const directKeys = scopeDirectKeys.get(prefix)!;
                    if (!directKeys.some(k => k.keyName === keyDef.keyName)) directKeys.push(keyDef);
                    const qualifiedName = `${prefix}.${keyDef.keyName}`;
                    if (!keySpace.keys.has(qualifiedName)) {
                        keySpace.keys.set(qualifiedName, { ...keyDef, keyName: qualifiedName });
                    }
                }
                if (!keySpace.keys.has(keyDef.keyName)) {
                    keySpace.keys.set(keyDef.keyName, keyDef);
                } else {
                    let dups = keySpace.duplicateKeys.get(keyDef.keyName);
                    if (!dups) {
                        dups = [keySpace.keys.get(keyDef.keyName)!, keyDef];
                        keySpace.duplicateKeys.set(keyDef.keyName, dups);
                    } else {
                        dups.push(keyDef);
                    }
                }
            }

            // Register topic-scope associations for context-aware resolution
            this.extractTopicReferences(
                maskedBlockContent, mapPath, childPrefixes[0], keySpace.topicToScope, maxLinkMatches
            );

            // Discover submaps inside this block and queue with combined scope prefix
            const blockSubmaps = this.extractMapReferences(maskedBlockContent, mapPath, maxLinkMatches);
            for (const submap of blockSubmaps) {
                const grandchildPrefixes = this.combineScopePrefixes(childPrefixes, submap.keyscopes);
                if (submap.inlineKeys.length > 0 && grandchildPrefixes.length > 0) {
                    for (const inlineKeyName of submap.inlineKeys) {
                        const inlineDef: KeyDefinition = {
                            keyName: inlineKeyName,
                            sourceMap: mapPath,
                            targetFile: submap.path,
                        };
                        for (const prefix of grandchildPrefixes) {
                            if (!scopeDirectKeys.has(prefix)) scopeDirectKeys.set(prefix, []);
                            const directKeys = scopeDirectKeys.get(prefix)!;
                            if (!directKeys.some(k => k.keyName === inlineKeyName)) directKeys.push(inlineDef);
                            const qualifiedName = `${prefix}.${inlineKeyName}`;
                            if (!keySpace.keys.has(qualifiedName)) {
                                keySpace.keys.set(qualifiedName, { ...inlineDef, keyName: qualifiedName });
                            }
                        }
                        if (!keySpace.keys.has(inlineKeyName)) keySpace.keys.set(inlineKeyName, inlineDef);
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
     * hrefs must not pollute scopeDirectKeys or topicToScope (DITA spec §2.4.4).
     */
    private stripReltables(content: string): string {
        return content.replace(/<reltable\b[^>]*>[\s\S]*?<\/reltable\s*>/gi, '');
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
