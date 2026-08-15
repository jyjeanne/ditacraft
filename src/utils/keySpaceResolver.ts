/**
 * Key Space Resolver
 * Resolves DITA key references by building a key space from map hierarchy.
 *
 * Includes DITA 1.3 `@keyscope` nested/scoped key support, ported from the
 * server's `KeySpaceService` (`server/src/services/keySpaceService.ts`,
 * whose own doc comment records it was originally forked FROM this file —
 * @keyscope support was added there afterward and never ported back here,
 * which is exactly the drift class this port closes: this resolver backs
 * `ditaLinkProvider.ts`'s clickable keyref/conkeyref document links and
 * `keySpaceViewProvider.ts`'s sidebar, both of which used to silently
 * disagree with the LSP server's (correct) hover/go-to-definition/
 * validation on any map using `@keyscope`).
 *
 * This is a deliberately *scoped* port, not a byte-for-byte mirror — two
 * pieces of the server's more advanced edge-case handling are intentionally
 * left out, since they exist to harden a bigger, actively-validated service
 * against pathological inputs, not because a navigation-only client feature
 * needs them for correctness in the common case:
 *   - **Diamond-shaped scope graphs** (the same submap reached twice via two
 *     different `@keyscope` paths) still only register the *first* scope
 *     path reached, like this resolver's pre-existing non-keyscope BFS
 *     already did for plain submaps. The server fixed this specifically
 *     (see `ROADMAP.md`'s v0.8.2 changes) with a `mapDirectKeysCache` +
 *     `registeredScopeSignatures` re-visit mechanism; porting that too would
 *     roughly double this port's size for a scope-graph shape that's rare
 *     even among projects that use `@keyscope` at all.
 *   - **Peer-scope diagnostics** (`duplicateKeys`, `scopeExplosionWarning`,
 *     `explainKey`'s step-by-step trace) are validation/debugging surfaces
 *     with no client-side consumer — this resolver only ever needs the
 *     winning definition, never a full trace of how it won.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import { logger } from './logger';
import { MAX_MAP_REFERENCES, TIME_CONSTANTS, CACHE_DEFAULTS, DEBOUNCE_CONSTANTS } from './constants';
import { configManager } from './configurationManager';

/**
 * Represents a single key definition in DITA
 */
export interface KeyDefinition {
    keyName: string;
    targetFile?: string;           // Resolved absolute path to target file
    elementId?: string;            // Element ID for conref targets (after #)
    inlineContent?: string;        // For inline key definitions (no href)
    sourceMap: string;             // Absolute path to map where key was defined
    scope?: string;                // Key scope (local, peer, external)
    processingRole?: string;       // resource-only, normal, etc.
    keyref?: string;               // Indirect key reference — resolution follows this chain
    metadata?: KeyMetadata;        // Additional metadata from topicmeta
}

/**
 * Key metadata from topicmeta element
 */
export interface KeyMetadata {
    navtitle?: string;
    keywords?: string[];
    shortdesc?: string;
}

/**
 * Complete key space for a root map
 */
export interface KeySpace {
    rootMap: string;                    // Absolute path to root map
    keys: Map<string, KeyDefinition>;   // Key name → definition (also holds "scope.keyname" qualified aliases)
    buildTime: number;                  // Timestamp when key space was built
    mapHierarchy: string[];             // All maps in hierarchy (in traversal order)
    /**
     * Maps each topic file path (normalized) to its primary `@keyscope`
     * prefix, e.g. "product.lib". Used by `resolveKey()` for context-aware
     * lookup: a keyref authored inside a scoped branch resolves against
     * that branch's own keys before falling back to the flat/global ones.
     */
    topicToScope: Map<string, string>;
    /**
     * Peer maps (`@scope="peer"` + `@keyscope`) encountered during BFS.
     * Not inlined into the main key space — DITA's peer scope means "not
     * part of my document, only reachable by explicit qualified name."
     * Maps keyscope-name → absolute map path; resolved lazily on a
     * `"scopeName.key"`-shaped lookup miss.
     */
    deferredPeerMaps: Map<string, string>;
}

/** DITA element attribute-list pattern — mirrors `TAG_ATTRS` in `server/src/utils/patterns.ts` (a small, deliberately independent copy per this project's client/server duplication convention; see the module doc comment). */
const TAG_ATTRS = `(?:"[^"]*"|'[^']*'|[^>"'])*`;

/** Guards `processInlineScopeBlocks`'s recursion against pathologically deep scope nesting. */
const MAX_INLINE_SCOPE_DEPTH = 10;

/** Caps total qualified scope-alias entries against combinatorial blowup from a scope graph with many branches. */
const MAX_KEY_SPACE_ENTRIES = 50_000;

/**
 * Cache configuration
 */
interface CacheConfig {
    ttlMs: number;                      // Time-to-live in milliseconds
    maxSize: number;                    // Max number of cached key spaces
}

/**
 * KeySpaceResolver - Builds and manages DITA key spaces
 */
export class KeySpaceResolver implements vscode.Disposable {
    private keySpaceCache: Map<string, KeySpace> = new Map();
    private rootMapCache: Map<string, { rootMap: string | null; timestamp: number }> = new Map();
    private cacheConfig: CacheConfig;
    private disposables: vscode.Disposable[] = [];
    private rootMapCacheTtl: number = CACHE_DEFAULTS.ROOT_MAP_CACHE_TTL; // 1 minute cache for root map lookups
    private debounceTimer: NodeJS.Timeout | undefined;
    private pendingInvalidations: Set<string> = new Set();
    // P1-2 Fix: Track in-progress builds to prevent duplicate concurrent work
    private pendingBuilds: Map<string, Promise<KeySpace>> = new Map();

    constructor() {
        this.cacheConfig = this.loadCacheConfig();

        // Set up file watcher for map files
        this.setupFileWatcher();

        // Set up periodic cache cleanup
        this.setupPeriodicCleanup();

        logger.debug('KeySpaceResolver initialized');
    }

    /**
     * Set up periodic cache cleanup timer
     * Runs cleanup every 1/3 of TTL to ensure timely cleanup
     * P2-3 Fix: Use named constant for cleanup interval ratio
     * P3-7 Fix: Adaptive cleanup - only runs when cache has entries
     */
    private setupPeriodicCleanup(): void {
        const cleanupInterval = Math.max(
            DEBOUNCE_CONSTANTS.MIN_CLEANUP_INTERVAL_MS,
            this.cacheConfig.ttlMs / DEBOUNCE_CONSTANTS.CACHE_CLEANUP_INTERVAL_RATIO
        );

        const cleanupTimer = setInterval(() => {
            // P3-7: Skip cleanup if caches are empty (adaptive cleanup)
            if (this.keySpaceCache.size === 0 && this.rootMapCache.size === 0) {
                logger.debug('Skipping cache cleanup - caches are empty');
                return;
            }

            logger.debug('Running periodic cache cleanup', {
                keySpaceCacheSize: this.keySpaceCache.size,
                rootMapCacheSize: this.rootMapCache.size
            });
            this.cleanupExpiredCacheEntries();
            this.cleanupExpiredRootMapCache();
        }, cleanupInterval);

        this.disposables.push({ dispose: () => clearInterval(cleanupTimer) });

        logger.debug('Periodic cache cleanup scheduled', {
            intervalMs: cleanupInterval,
            ttlMs: this.cacheConfig.ttlMs
        });
    }

    /**
     * Load cache configuration from VS Code settings
     * P1-4 Fix: Use centralized configManager
     */
    private loadCacheConfig(): CacheConfig {
        const ttlMinutes = configManager.get('keySpaceCacheTtlMinutes');
        return {
            ttlMs: ttlMinutes * TIME_CONSTANTS.ONE_MINUTE,
            maxSize: CACHE_DEFAULTS.MAX_KEY_SPACES  // Max 10 root maps
        };
    }

    /**
     * Reload cache configuration (call when settings change)
     */
    public reloadCacheConfig(): void {
        const oldConfig = this.cacheConfig;
        this.cacheConfig = this.loadCacheConfig();

        logger.debug('KeySpaceResolver cache config reloaded', {
            oldTtlMinutes: oldConfig.ttlMs / 60000,
            newTtlMinutes: this.cacheConfig.ttlMs / 60000,
            maxSize: this.cacheConfig.maxSize
        });

        // Immediately clean up with new TTL
        this.cleanupExpiredCacheEntries();
    }

    /**
     * Get max link matches from configuration
     * P1-4 Fix: Use centralized configManager
     */
    private getMaxMatches(): number {
        return configManager.get('maxLinkMatches');
    }

    /**
     * Normalize a filesystem path for workspace-boundary comparison.
     *
     * Case-folds on win32 (mirroring `normalizeFsPath` in
     * `server/src/utils/textUtils.ts`) so two paths that refer to the same
     * file but were derived through different code paths — e.g. one via a
     * `file://` URI round-trip, which `vscode-uri` lowercases the drive
     * letter of, and one from a raw fs path — still compare equal. Without
     * this, a path differing only in drive-letter case from a configured
     * workspace folder would be wrongly treated as outside the workspace on
     * Windows.
     */
    private normalizePathForComparison(fsPath: string): string {
        const normalized = path.normalize(fsPath);
        return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
    }

    /**
     * Check if a path is safely within the workspace boundaries.
     * Prevents path traversal attacks (e.g., ../../etc/passwd).
     * Only allows paths INSIDE workspace folders, not the root itself,
     * to prevent potential access to sensitive files at workspace root level.
     */
    private isPathWithinWorkspace(absolutePath: string): boolean {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            // No workspace open, allow all paths (single file mode)
            return true;
        }

        const normalizedPath = this.normalizePathForComparison(absolutePath);
        return workspaceFolders.some(folder => {
            const normalizedWorkspace = this.normalizePathForComparison(folder.uri.fsPath);
            // Only allow paths that are INSIDE the workspace, not equal to workspace root
            return normalizedPath.startsWith(normalizedWorkspace + path.sep);
        });
    }

    /**
     * Set up file system watcher for map files
     * P2-7 Fix: Use try-finally to ensure watcher is disposed if setup fails
     */
    private setupFileWatcher(): void {
        // Watch for changes to .ditamap and .bookmap files
        let watcher: vscode.FileSystemWatcher | null = null;
        try {
            watcher = vscode.workspace.createFileSystemWatcher(
                '**/*.{ditamap,bookmap}',
                false,  // Don't ignore creates
                false,  // Don't ignore changes
                false   // Don't ignore deletes
            );

            // Invalidate cache when maps change (with debouncing)
            watcher.onDidChange(uri => {
                logger.debug('Map file changed, queueing invalidation', { file: uri.fsPath });
                this.queueInvalidation(uri.fsPath);
            });

            watcher.onDidCreate(uri => {
                logger.debug('Map file created, queueing invalidation', { file: uri.fsPath });
                this.queueInvalidation(uri.fsPath);
            });

            watcher.onDidDelete(uri => {
                logger.debug('Map file deleted, queueing invalidation', { file: uri.fsPath });
                this.queueInvalidation(uri.fsPath);
            });

            // Successfully set up - add to disposables for cleanup
            this.disposables.push(watcher);
        } catch (error) {
            // If any error occurs during setup, dispose the watcher to prevent leak
            watcher?.dispose();
            logger.error('Failed to set up file watcher', error);
            throw error;
        }
    }

    /**
     * Queue file invalidation with debouncing (300ms)
     * Prevents multiple rapid invalidations during bulk file operations
     */
    private queueInvalidation(filePath: string): void {
        this.pendingInvalidations.add(filePath);

        // Clear existing timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Set new timer to process all pending invalidations
        this.debounceTimer = setTimeout(() => {
            logger.debug('Processing debounced invalidations', {
                count: this.pendingInvalidations.size
            });

            for (const file of this.pendingInvalidations) {
                this.invalidateCacheForFile(file);
            }

            this.pendingInvalidations.clear();
            this.debounceTimer = undefined;
        }, DEBOUNCE_CONSTANTS.FILE_WATCHER_DEBOUNCE_MS); // 300ms debounce
    }

    /**
     * Invalidate cache entries that include the changed file
     */
    private invalidateCacheForFile(changedFile: string): void {
        const normalizedPath = path.normalize(changedFile);
        const changedDir = path.dirname(normalizedPath);

        // Clear root map cache for the affected directory
        this.rootMapCache.delete(changedDir);

        // Check each cached key space to see if it includes this file
        for (const [rootMap, keySpace] of this.keySpaceCache.entries()) {
            if (keySpace.mapHierarchy.some(mapPath =>
                path.normalize(mapPath) === normalizedPath
            )) {
                logger.debug('Invalidating key space cache', { rootMap });
                this.keySpaceCache.delete(rootMap);
            }
        }
    }

    /**
     * Build key space from a root map
     *
     * This is the main entry point for building a DITA key space. It implements
     * caching and deduplication to optimize performance.
     *
     * ## Caching Strategy
     * 1. **TTL-based cache**: Returns cached key space if within TTL (default 5 min)
     * 2. **In-flight deduplication**: If a build is already in progress for the same
     *    root map, returns the existing promise instead of starting a duplicate build
     *
     * ## Algorithm Overview
     * Uses **Breadth-First Search (BFS)** to traverse the map hierarchy. This is
     * critical for DITA key precedence semantics where the **first definition wins**.
     *
     * ```
     * root.ditamap
     *     ├── chapter1.ditamap  (keys defined here win)
     *     │   └── submap.ditamap
     *     └── chapter2.ditamap  (same keys defined here lose)
     * ```
     *
     * ## Thread Safety (P1-2 Fix)
     * Multiple concurrent calls for the same root map will share a single build:
     * - First caller triggers the actual build
     * - Subsequent callers receive the same Promise
     * - Promise is removed from tracking after build completes
     *
     * @param rootMapPath - Absolute or relative path to the root DITA map
     * @returns Promise resolving to a KeySpace containing all key definitions
     *
     * @example
     * ```typescript
     * const keySpace = await resolver.buildKeySpace('/path/to/root.ditamap');
     * console.log(`Found ${keySpace.keys.size} key definitions`);
     * console.log(`Traversed ${keySpace.mapHierarchy.length} maps`);
     * ```
     */
    public async buildKeySpace(rootMapPath: string): Promise<KeySpace> {
        const absoluteRootPath = path.isAbsolute(rootMapPath)
            ? rootMapPath
            : path.resolve(rootMapPath);

        // Check cache first
        const cached = this.keySpaceCache.get(absoluteRootPath);
        if (cached && (Date.now() - cached.buildTime) < this.cacheConfig.ttlMs) {
            logger.debug('Using cached key space', { rootMap: absoluteRootPath });
            return cached;
        }

        // P1-2 Fix: Check if build is already in progress for this root map
        const pendingBuild = this.pendingBuilds.get(absoluteRootPath);
        if (pendingBuild) {
            logger.debug('Waiting for in-progress key space build', { rootMap: absoluteRootPath });
            return pendingBuild;
        }

        // Start the actual build and track it
        const buildPromise = this.doBuildKeySpace(absoluteRootPath);
        this.pendingBuilds.set(absoluteRootPath, buildPromise);

        try {
            const result = await buildPromise;
            return result;
        } finally {
            // Always clean up the pending build entry
            this.pendingBuilds.delete(absoluteRootPath);
        }
    }

    /**
     * Internal method that performs the actual key space build
     *
     * Implements the core BFS algorithm for traversing the DITA map hierarchy
     * and collecting key definitions.
     *
     * ## Algorithm
     * ```
     * 1. Initialize empty KeySpace with root map
     * 2. Create queue with root map, visited set
     * 3. While queue not empty:
     *    a. Dequeue next map
     *    b. Skip if already visited (circular reference protection)
     *    c. Read and parse map content
     *    d. Extract key definitions (first-wins precedence)
     *    e. Extract submap references, add to queue
     * 4. Cache and return completed KeySpace
     * ```
     *
     * ## Key Precedence
     * DITA specifies that when the same key is defined multiple times,
     * the **first definition wins**. BFS ensures maps closer to the root
     * in the hierarchy have their keys processed first.
     *
     * ## Security Measures
     * - **Circular reference protection**: Tracks visited maps in a Set
     * - **Path traversal prevention**: All resolved paths validated against workspace boundaries
     * - **Match limiting**: Regex operations bounded by `maxLinkMatches` config
     *
     * @param absoluteRootPath - Absolute path to the root map
     * @returns Promise resolving to the fully built KeySpace
     */
    private async doBuildKeySpace(absoluteRootPath: string): Promise<KeySpace> {
        logger.info('Building key space', { rootMap: absoluteRootPath });

        const keySpace: KeySpace = {
            rootMap: absoluteRootPath,
            keys: new Map(),
            buildTime: Date.now(),
            mapHierarchy: [],
            topicToScope: new Map(),
            deferredPeerMaps: new Map(),
        };

        const visited = new Set<string>();
        const queue: { mapPath: string; scopePrefixes: string[] }[] = [
            { mapPath: absoluteRootPath, scopePrefixes: [] },
        ];

        // Tracks the highest-priority key definition per key name per scope
        // prefix. The PushDown pass (after the BFS below) uses this to
        // propagate ancestor-scope keys into descendant scope namespaces
        // (e.g. "product.lib.version" inherits from "product.version").
        const scopeDirectKeys = new Map<string, KeyDefinition[]>();

        // Breadth-first traversal of map hierarchy
        while (queue.length > 0) {
            const { mapPath: currentMap, scopePrefixes } = queue.shift()!;
            const normalizedPath = path.normalize(currentMap);

            // Skip already visited maps (circular reference protection).
            // Note: unlike the server's KeySpaceService, a diamond-shaped
            // scope graph (the same map reached again via a *different*
            // @keyscope path) still only registers the first scope path —
            // see the module doc comment for why that's an accepted gap here.
            if (visited.has(normalizedPath)) {
                logger.debug('Skipping already visited map', { map: currentMap });
                continue;
            }

            // Check if file exists (async to avoid blocking UI)
            const fileExists = await this.fileExistsAsync(currentMap);
            if (!fileExists) {
                logger.warn('Map file not found', { map: currentMap });
                continue;
            }

            visited.add(normalizedPath);
            keySpace.mapHierarchy.push(currentMap);

            try {
                // Read and parse current map — strip comments/CDATA, then reltable blocks.
                // reltable hrefs are relationship-table links, not key space content (spec §2.4.4).
                // Blanked (not deleted) so every offset computed against this
                // string later (extractInlineScopeBlocks, etc.) stays valid.
                const rawContent = await this.readFileAsync(currentMap);
                const mapContent = rawContent
                    .replace(/<!--[\s\S]*?-->/g, (m) => ' '.repeat(m.length))
                    .replace(/<!\[CDATA\[[\s\S]*?]]>/g, (m) => ' '.repeat(m.length))
                    .replace(/<reltable\b[^>]*>[\s\S]*?<\/reltable\s*>/gi, (m) => m.replace(/[^\n\r]/g, ' '));

                const rootScopes = this.extractRootKeyscope(mapContent);
                const effectivePrefixes = this.combineScopePrefixes(scopePrefixes, rootScopes);
                // The primary prefix is the first (canonical) scope path for
                // this map, used for topic-to-scope tracking. All prefixes
                // (multi-name keyscope) are used for scopeDirectKeys so the
                // PushDown pass inherits correctly for every alias.
                const primaryPrefix = effectivePrefixes[0] ?? '';
                const allScopePrefixes = effectivePrefixes.length > 0 ? effectivePrefixes : [''];

                for (const prefix of allScopePrefixes) {
                    if (!scopeDirectKeys.has(prefix)) {
                        scopeDirectKeys.set(prefix, []);
                    }
                }

                // Handle inline scope branches (topicrefs with @keyscope that
                // don't reference an external map). Returns mapContent with
                // those blocks blanked out so child-scope keys aren't
                // double-processed by the extraction calls below.
                const maskedContent = this.processInlineScopeBlocks(
                    mapContent, currentMap, effectivePrefixes, keySpace, scopeDirectKeys, queue
                );

                // Extract key definitions
                const keys = this.extractKeyDefinitions(maskedContent, currentMap);

                for (const keyDef of keys) {
                    // Record as a direct key of every scope alias.
                    for (const prefix of allScopePrefixes) {
                        const directKeys = scopeDirectKeys.get(prefix)!;
                        if (!directKeys.some(k => k.keyName === keyDef.keyName)) {
                            directKeys.push(keyDef);
                        }
                    }

                    // Unqualified entry — first definition across the whole key space wins.
                    if (!keySpace.keys.has(keyDef.keyName)) {
                        keySpace.keys.set(keyDef.keyName, keyDef);
                        logger.debug('Added key definition', {
                            key: keyDef.keyName,
                            source: path.basename(currentMap)
                        });
                    }

                    // Scope-qualified entries — first definition per qualified name wins.
                    for (const prefix of effectivePrefixes) {
                        const qualifiedName = `${prefix}.${keyDef.keyName}`;
                        this.addScopedKeyEntry(keySpace, qualifiedName, { ...keyDef, keyName: qualifiedName });
                    }
                }

                // Record which scope each referenced topic belongs to, for
                // context-aware lookup in resolveKey().
                this.extractTopicReferences(maskedContent, currentMap, primaryPrefix, keySpace.topicToScope);

                // Find and queue submaps (masked content, so submaps inside
                // inline scope blocks — already queued above — aren't queued twice).
                const submaps = this.extractMapReferences(maskedContent, currentMap);
                for (const submap of submaps) {
                    // Peer maps are not inlined; registered for lazy resolution on a "scope.key" miss.
                    if (submap.isPeer) {
                        for (const scopeName of submap.keyscopes) {
                            if (!keySpace.deferredPeerMaps.has(scopeName)) {
                                keySpace.deferredPeerMaps.set(scopeName, submap.path);
                            }
                        }
                        continue;
                    }

                    const childPrefixes = this.combineScopePrefixes(effectivePrefixes, submap.keyscopes);

                    // @keys on the mapref element itself belong to the child
                    // scope it creates (DITA spec §2.4.4.1).
                    this.registerInlineMaprefKeys(
                        keySpace, scopeDirectKeys, submap.inlineKeys, currentMap, submap.path, childPrefixes
                    );

                    queue.push({ mapPath: submap.path, scopePrefixes: childPrefixes });
                }

            } catch (error) {
                logger.error('Error parsing map file', { map: currentMap, error });
            }
        }

        // PushDown pass: for every child scope, inherit ancestor-scope key
        // definitions at lower priority, so a key defined in an ancestor scope
        // (e.g. "product.version") is resolvable via its fully-qualified
        // child-scope name (e.g. "product.lib.version") when authoring within
        // the "lib" child scope. Keys already in the child scope aren't overwritten.
        for (const [childPrefix] of scopeDirectKeys) {
            if (childPrefix === '') continue;
            const parts = childPrefix.split('.');
            for (let depth = 0; depth < parts.length; depth++) {
                const ancestorPrefix = parts.slice(0, depth).join('.');
                for (const ancestorKey of scopeDirectKeys.get(ancestorPrefix) ?? []) {
                    const inheritedName = `${childPrefix}.${ancestorKey.keyName}`;
                    this.addScopedKeyEntry(keySpace, inheritedName, { ...ancestorKey, keyName: inheritedName });
                }
            }
        }

        logger.info('Key space built successfully', {
            rootMap: absoluteRootPath,
            keyCount: keySpace.keys.size,
            mapCount: keySpace.mapHierarchy.length
        });

        // Cache the result
        this.cacheKeySpace(keySpace);

        return keySpace;
    }

    /**
     * Cache a key space with LRU eviction and TTL cleanup
     */
    private cacheKeySpace(keySpace: KeySpace): void {
        // First, clean up expired entries based on TTL
        this.cleanupExpiredCacheEntries();

        // Evict oldest entries if cache is still full after TTL cleanup
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
                logger.debug('Evicting oldest key space from cache', { rootMap: oldestKey });
                this.keySpaceCache.delete(oldestKey);
            }
        }

        this.keySpaceCache.set(keySpace.rootMap, keySpace);
    }

    /**
     * Clean up expired cache entries based on TTL
     * Removes all entries older than cacheConfig.ttlMs
     */
    private cleanupExpiredCacheEntries(): void {
        const now = Date.now();
        const expiredKeys: string[] = [];

        for (const [key, space] of this.keySpaceCache.entries()) {
            if ((now - space.buildTime) > this.cacheConfig.ttlMs) {
                expiredKeys.push(key);
            }
        }

        if (expiredKeys.length > 0) {
            expiredKeys.forEach(key => {
                // P0-3 Fix: Safe access to cache entry (avoid non-null assertion)
                const cachedEntry = this.keySpaceCache.get(key);
                logger.debug('Removing expired key space from cache', {
                    rootMap: key,
                    ageMs: cachedEntry ? now - cachedEntry.buildTime : 0
                });
                this.keySpaceCache.delete(key);
            });

            logger.info('Key space cache cleanup completed', {
                removedCount: expiredKeys.length,
                remainingCount: this.keySpaceCache.size
            });
        }
    }

    /**
     * Clean up expired root map cache entries
     * P3-7: Added for comprehensive adaptive cache cleanup
     */
    private cleanupExpiredRootMapCache(): void {
        const now = Date.now();
        const expiredKeys: string[] = [];

        for (const [key, entry] of this.rootMapCache.entries()) {
            if ((now - entry.timestamp) > this.rootMapCacheTtl) {
                expiredKeys.push(key);
            }
        }

        if (expiredKeys.length > 0) {
            expiredKeys.forEach(key => this.rootMapCache.delete(key));

            logger.debug('Root map cache cleanup completed', {
                removedCount: expiredKeys.length,
                remainingCount: this.rootMapCache.size
            });
        }
    }

    /**
     * Extract key definitions from map content
     *
     * Parses DITA map XML to extract all key definitions. A key definition can
     * come from any element with a `@keys` attribute, not just `<keydef>`.
     *
     * ## Supported Key Definition Patterns
     * ```xml
     * <!-- Standard keydef -->
     * <keydef keys="product-name" href="product.dita"/>
     *
     * <!-- Multiple keys on single element -->
     * <keydef keys="alias1 alias2 alias3" href="target.dita"/>
     *
     * <!-- Key on topicref -->
     * <topicref keys="chapter1" href="chapter1.dita"/>
     *
     * <!-- Inline key definition (no href) -->
     * <keydef keys="version">
     *   <topicmeta><keywords><keyword>2.0</keyword></keywords></topicmeta>
     * </keydef>
     * ```
     *
     * ## Extracted Attributes
     * - `keys`: Space-separated key names (required)
     * - `href`: Target file path (optional, resolved relative to map)
     * - `scope`: local, peer, or external
     * - `processing-role`: resource-only, normal, etc.
     *
     * ## Security
     * - All resolved paths validated against workspace boundaries
     * - Match count bounded by `maxLinkMatches` config (ReDoS protection)
     * - Path traversal attempts logged and blocked
     *
     * @param mapContent - Raw XML content of the DITA map
     * @param mapPath - Absolute path to the map file (used for relative path resolution)
     * @returns Array of KeyDefinition objects extracted from the map
     */
    private extractKeyDefinitions(mapContent: string, mapPath: string): KeyDefinition[] {
        const keys: KeyDefinition[] = [];
        const mapDir = path.dirname(mapPath);

        // Regex to match keydef elements or any element with @keys attribute
        // Pattern: <keydef keys="..." or <topicref keys="..." etc.
        const keydefRegex = /<(\w+)[^>]*\bkeys\s*=\s*["']([^"']+)["'][^>]*>/gi;

        let match: RegExpExecArray | null;
        let matchCount = 0;
        const maxMatches = this.getMaxMatches();

        while ((match = keydefRegex.exec(mapContent)) !== null) {
            if (++matchCount > maxMatches) {
                break;
            }

            const keysValue = match[2];
            const fullElement = match[0];

            // A single @keys attribute can define multiple keys (space-separated)
            const keyNames = keysValue.split(/\s+/).filter(k => k.length > 0);

            for (const keyName of keyNames) {
                const keyDef: KeyDefinition = {
                    keyName: keyName,
                    sourceMap: mapPath
                };

                // Extract href if present
                const hrefMatch = fullElement.match(/\bhref\s*=\s*["']([^"']+)["']/i);
                if (hrefMatch) {
                    const href = hrefMatch[1];

                    // Handle fragment identifier (e.g., file.dita#elementId)
                    if (href.includes('#')) {
                        const [filePart, elementId] = href.split('#');
                        if (filePart) {
                            const resolvedPath = path.resolve(mapDir, filePart);
                            // Validate path is within workspace bounds
                            if (this.isPathWithinWorkspace(resolvedPath)) {
                                keyDef.targetFile = resolvedPath;
                            } else {
                                logger.warn('Path traversal attempt blocked', { href: filePart, mapPath });
                            }
                        }
                        if (elementId) {
                            keyDef.elementId = elementId;
                        }
                    } else if (!href.startsWith('http://') && !href.startsWith('https://')) {
                        // Resolve relative path
                        const resolvedPath = path.resolve(mapDir, href);
                        // Validate path is within workspace bounds
                        if (this.isPathWithinWorkspace(resolvedPath)) {
                            keyDef.targetFile = resolvedPath;
                        } else {
                            logger.warn('Path traversal attempt blocked', { href, mapPath });
                        }
                    }
                }

                // Extract scope if present
                const scopeMatch = fullElement.match(/\bscope\s*=\s*["']([^"']+)["']/i);
                if (scopeMatch) {
                    keyDef.scope = scopeMatch[1];
                }

                // Extract processing-role if present
                const roleMatch = fullElement.match(/\bprocessing-role\s*=\s*["']([^"']+)["']/i);
                if (roleMatch) {
                    keyDef.processingRole = roleMatch[1];
                }

                // Extract keyref (indirect key alias)
                const keyrefMatch = fullElement.match(/\bkeyref\s*=\s*["']([^"']+)["']/i);
                if (keyrefMatch) {
                    keyDef.keyref = keyrefMatch[1];
                }

                // Check for inline content (keydef without href)
                if (!keyDef.targetFile) {
                    // Try to extract inline content from topicmeta/keywords
                    const inlineMatch = this.extractInlineContent(mapContent, match.index);
                    if (inlineMatch) {
                        keyDef.inlineContent = inlineMatch;
                    }
                }

                keys.push(keyDef);
            }
        }

        return keys;
    }

    /**
     * Extract inline content for a keydef (from topicmeta/keywords)
     */
    private extractInlineContent(mapContent: string, startIndex: number): string | null {
        // Look for topicmeta immediately following the opening tag
        const afterElement = mapContent.substring(startIndex);

        // Simple pattern to find keyword content
        const keywordMatch = afterElement.match(/<topicmeta[^>]*>[\s\S]*?<keyword[^>]*>([^<]+)<\/keyword>/i);
        if (keywordMatch) {
            return keywordMatch[1].trim();
        }

        return null;
    }

    /**
     * Extract map references from map content (mapref, topicgroup with href to map)
     */
    private extractMapReferences(
        mapContent: string,
        mapPath: string
    ): { path: string; keyscopes: string[]; inlineKeys: string[]; isPeer: boolean }[] {
        const submaps: { path: string; keyscopes: string[]; inlineKeys: string[]; isPeer: boolean }[] = [];
        const mapDir = path.dirname(mapPath);

        // Match ANY element with href pointing to a .ditamap or .bookmap file.
        // This covers mapref, topicref, chapter, appendix, part, glossarylist,
        // frontmatter, backmatter, notices, preface, topichead, anchorref, etc.
        // Also capture @keyscope/@keys/@scope for key scope support.
        const mapRefRegex = new RegExp(`<\\w+\\b${TAG_ATTRS}\\bhref\\s*=\\s*["']([^"']+\\.(?:ditamap|bookmap))["']${TAG_ATTRS}>`, 'gi');

        let match: RegExpExecArray | null;
        let matchCount = 0;
        // Use 1/10 of maxLinkMatches for map references (minimum 1000)
        const maxMatches = Math.max(MAX_MAP_REFERENCES, Math.floor(this.getMaxMatches() / 10));

        while ((match = mapRefRegex.exec(mapContent)) !== null) {
            if (++matchCount > maxMatches) {
                break;
            }

            const href = match[1];

            // Skip external URLs
            if (href.startsWith('http://') || href.startsWith('https://')) {
                continue;
            }

            // Resolve relative path
            const absolutePath = path.resolve(mapDir, href);

            // Validate path is within workspace bounds
            if (this.isPathWithinWorkspace(absolutePath)) {
                const keyscopeMatch = match[0].match(/\bkeyscope\s*=\s*["']([^"']+)["']/i);
                const keyscopes = keyscopeMatch
                    ? keyscopeMatch[1].split(/\s+/).filter(s => s.length > 0)
                    : [];
                // @keys on the same element as @keyscope belongs to the child scope (DITA spec §2.4.4.1).
                const keysMatch = keyscopes.length > 0
                    ? match[0].match(/\bkeys\s*=\s*["']([^"']+)["']/i)
                    : null;
                const inlineKeys = keysMatch
                    ? keysMatch[1].split(/\s+/).filter(k => k.length > 0)
                    : [];
                // Peer maps with @keyscope are not inlined -- only accessible via "scopeName.keyName".
                const scopeMatch = match[0].match(/\bscope\s*=\s*["']([^"']+)["']/i);
                const isPeer = scopeMatch?.[1] === 'peer' && keyscopes.length > 0;
                submaps.push({ path: absolutePath, keyscopes, inlineKeys, isPeer });
            } else {
                logger.warn('Map reference outside workspace blocked', { href, mapPath });
            }
        }

        return submaps;
    }

    /** Extract keyscope(s) from the root map/bookmap element. */
    private extractRootKeyscope(mapContent: string): string[] {
        const rootMatch = mapContent.match(new RegExp(`<(?:map|bookmap)\\b(${TAG_ATTRS})`, 'i'));
        if (!rootMatch) return [];
        const keyscopeMatch = rootMatch[1].match(/\bkeyscope\s*=\s*["']([^"']+)["']/i);
        return keyscopeMatch ? keyscopeMatch[1].split(/\s+/).filter(s => s.length > 0) : [];
    }

    /**
     * Compute the cross product of parent scope prefixes and child scope names.
     * - If childScopes is empty, returns parentPrefixes unchanged (scope is inherited).
     * - If parentPrefixes is empty, returns childScopes as new prefixes.
     * - Otherwise returns every "parent.child" combination.
     * Uses a Set internally to deduplicate.
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
     * Insert a scope-qualified alias entry only when the key space has not
     * yet reached the combinatorial-explosion cap. Always a no-op when the
     * name already exists (first-definition wins).
     */
    private addScopedKeyEntry(keySpace: KeySpace, qualifiedName: string, def: KeyDefinition): void {
        if (keySpace.keys.has(qualifiedName)) return;
        if (keySpace.keys.size >= MAX_KEY_SPACE_ENTRIES) return;
        keySpace.keys.set(qualifiedName, def);
    }

    /** Register @keys defined directly on a mapref element under the child scope it creates. */
    private registerInlineMaprefKeys(
        keySpace: KeySpace,
        scopeDirectKeys: Map<string, KeyDefinition[]>,
        inlineKeys: string[],
        sourceMap: string,
        targetFile: string,
        childPrefixes: string[]
    ): void {
        if (inlineKeys.length === 0 || childPrefixes.length === 0) return;

        for (const inlineKeyName of inlineKeys) {
            const inlineDef: KeyDefinition = { keyName: inlineKeyName, sourceMap, targetFile };
            for (const prefix of childPrefixes) {
                if (!scopeDirectKeys.has(prefix)) {
                    scopeDirectKeys.set(prefix, []);
                }
                const directKeys = scopeDirectKeys.get(prefix)!;
                if (!directKeys.some(k => k.keyName === inlineKeyName)) {
                    directKeys.push(inlineDef);
                }
                const qualifiedName = `${prefix}.${inlineKeyName}`;
                this.addScopedKeyEntry(keySpace, qualifiedName, { ...inlineDef, keyName: qualifiedName });
            }
            if (!keySpace.keys.has(inlineKeyName)) {
                keySpace.keys.set(inlineKeyName, inlineDef);
            }
        }
    }

    /**
     * Record which scope each topic reference belongs to (used by resolveKey()
     * for context-aware lookup). Only the first scope a topic is seen under wins.
     */
    private extractTopicReferences(
        mapContent: string,
        mapPath: string,
        scopePrefix: string,
        topicToScope: Map<string, string>
    ): void {
        const mapDir = path.dirname(mapPath);
        const topicRefRegex = new RegExp(
            `<(\\w+)\\b${TAG_ATTRS}\\bhref\\s*=\\s*["']([^"'#]+\\.(?:dita|xml))(?:#[^"']*)?["']`,
            'gi'
        );
        let match: RegExpExecArray | null;
        let count = 0;
        const maxMatches = this.getMaxMatches();
        while ((match = topicRefRegex.exec(mapContent)) !== null) {
            if (++count > maxMatches) break;
            if (['mapref', 'keydef', 'subjectdef'].includes(match[1].toLowerCase())) continue;
            const href = match[2];
            if (href.startsWith('http://') || href.startsWith('https://')) continue;
            const resolved = path.resolve(mapDir, href);
            if (!this.isPathWithinWorkspace(resolved)) continue;
            const normalized = this.normalizePathForComparison(resolved);
            if (!topicToScope.has(normalized)) {
                topicToScope.set(normalized, scopePrefix);
            }
        }
    }

    /**
     * Given a position immediately after an element's opening tag, find the
     * matching closing tag and return the inner content and the end position
     * of the close tag. Handles nesting of same-name elements via a depth counter.
     */
    private findInnerContent(content: string, fromIndex: number, tagName: string): { content: string; end: number } | null {
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
                // Scan forward to the closing '>' of this opening tag to
                // determine whether it's self-closing (self-closing elements
                // don't introduce a new nesting level).
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
     * Preserves string length so lastIndex/offset values computed against
     * the original content remain valid after masking.
     */
    private maskRanges(content: string, ranges: Array<{ start: number; end: number }>): string {
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
     * Find all top-level elements within `content` that carry @keyscope but do
     * NOT reference an external .ditamap/.bookmap file -- "inline scope
     * branches" whose child key definitions must be processed under the
     * child scope prefix. Only top-level blocks are returned; nested ones are
     * found recursively by `processInlineScopeBlocks` so they're never
     * double-processed.
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

        const keyscopedRe = new RegExp(`<(\\w+)\\b${TAG_ATTRS}\\bkeyscope\\s*=\\s*["']([^"']+)["']${TAG_ATTRS}>`, 'gi');

        let match: RegExpExecArray | null;
        while ((match = keyscopedRe.exec(content)) !== null) {
            const fullOpenTag = match[0];
            const elemName = match[1];

            // Root map/bookmap keyscopes are handled by extractRootKeyscope.
            if (/^(?:map|bookmap)$/i.test(elemName)) continue;
            // Submap references are handled by extractMapReferences + inlineKeys mechanism.
            if (/\bhref\s*=\s*["'][^"']*\.(?:ditamap|bookmap)["']/i.test(fullOpenTag)) continue;
            // Self-closing elements have no children to scope.
            if (fullOpenTag.endsWith('/>')) continue;

            const openTagEnd = match.index + fullOpenTag.length;
            const inner = this.findInnerContent(content, openTagEnd, elemName);
            if (!inner) continue;

            const keyscopes = match[2].split(/\s+/).filter(s => s.length > 0);
            const keysMatch = fullOpenTag.match(/\bkeys\s*=\s*["']([^"']+)["']/i);
            const inlineKeys = keysMatch ? keysMatch[1].split(/\s+/).filter(k => k.length > 0) : [];

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
            !blocks.some(other =>
                other !== block && other.outerStart < block.outerStart && block.outerEnd <= other.outerEnd
            )
        );
    }

    /**
     * Recursively process inline scope branches within map content. For each
     * top-level element with @keyscope (but no external map href): compute
     * child scope prefixes, register @keys on the scope element itself,
     * recurse into its inner content (handles nesting), extract key
     * definitions/topic references from it under the child scope, and queue
     * any submaps found inside it. Returns the input content with all inline
     * scope block ranges blanked out so the caller's own
     * extractKeyDefinitions/extractTopicReferences/extractMapReferences calls
     * don't double-count child-scope content.
     */
    private processInlineScopeBlocks(
        content: string,
        mapPath: string,
        parentEffectivePrefixes: string[],
        keySpace: KeySpace,
        scopeDirectKeys: Map<string, KeyDefinition[]>,
        bfsQueue: Array<{ mapPath: string; scopePrefixes: string[] }>,
        depth = 0
    ): string {
        if (depth > MAX_INLINE_SCOPE_DEPTH) return content;

        const blocks = this.extractInlineScopeBlocks(content);
        if (blocks.length === 0) return content;

        const maskedContent = this.maskRanges(content, blocks.map(b => ({ start: b.outerStart, end: b.outerEnd })));

        for (const block of blocks) {
            const childPrefixes = this.combineScopePrefixes(parentEffectivePrefixes, block.keyscopes);
            if (childPrefixes.length === 0) continue;

            for (const prefix of childPrefixes) {
                if (!scopeDirectKeys.has(prefix)) scopeDirectKeys.set(prefix, []);
            }

            // @keys on the scope-creating element itself belong to the child scope (DITA §2.4.4.1).
            for (const inlineKeyName of block.inlineKeys) {
                const inlineDef: KeyDefinition = { keyName: inlineKeyName, sourceMap: mapPath };
                for (const prefix of childPrefixes) {
                    const directKeys = scopeDirectKeys.get(prefix)!;
                    if (!directKeys.some(k => k.keyName === inlineKeyName)) directKeys.push(inlineDef);
                    const qualifiedName = `${prefix}.${inlineKeyName}`;
                    this.addScopedKeyEntry(keySpace, qualifiedName, { ...inlineDef, keyName: qualifiedName });
                }
                if (!keySpace.keys.has(inlineKeyName)) keySpace.keys.set(inlineKeyName, inlineDef);
            }

            // Recurse into nested inline scopes.
            const maskedBlockContent = this.processInlineScopeBlocks(
                block.innerContent, mapPath, childPrefixes, keySpace, scopeDirectKeys, bfsQueue, depth + 1
            );

            // Register key definitions from the (masked) block content under child scope.
            const blockKeys = this.extractKeyDefinitions(maskedBlockContent, mapPath);
            for (const keyDef of blockKeys) {
                for (const prefix of childPrefixes) {
                    const directKeys = scopeDirectKeys.get(prefix)!;
                    if (!directKeys.some(k => k.keyName === keyDef.keyName)) directKeys.push(keyDef);
                    const qualifiedName = `${prefix}.${keyDef.keyName}`;
                    this.addScopedKeyEntry(keySpace, qualifiedName, { ...keyDef, keyName: qualifiedName });
                }
                if (!keySpace.keys.has(keyDef.keyName)) {
                    keySpace.keys.set(keyDef.keyName, keyDef);
                }
            }

            // Register topic-scope associations for context-aware resolution.
            this.extractTopicReferences(maskedBlockContent, mapPath, childPrefixes[0], keySpace.topicToScope);

            // Discover submaps inside this block and queue with combined scope prefix.
            const blockSubmaps = this.extractMapReferences(maskedBlockContent, mapPath);
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
                this.registerInlineMaprefKeys(
                    keySpace, scopeDirectKeys, submap.inlineKeys, mapPath, submap.path, grandchildPrefixes
                );
                bfsQueue.push({ mapPath: submap.path, scopePrefixes: grandchildPrefixes });
            }
        }

        return maskedContent;
    }

    /**
     * Resolve a key name to its definition
     *
     * This is the primary API for key resolution. Given a key name and context file,
     * finds the appropriate key definition from the governing root map's key space.
     *
     * ## Resolution Process
     * 1. **Find root map**: Search upward from context file to find governing `.ditamap`
     * 2. **Build key space**: Traverse map hierarchy using BFS (cached if available)
     * 3. **Lookup key**: Return definition from key space, or null if not defined
     *
     * ## Key Scoping
     * Key definitions are scoped to their root map. A key defined in one documentation
     * project won't be visible from files in a different project (different root map).
     *
     * ## Performance
     * Both root map finding and key space building are heavily cached:
     * - Root map cache: 1-minute TTL per directory
     * - Key space cache: Configurable TTL (default 5 minutes)
     *
     * @param keyName - The key name to resolve (e.g., "product-name")
     * @param contextFilePath - Path to the file containing the key reference
     * @returns Promise resolving to KeyDefinition if found, null otherwise
     *
     * @example
     * ```typescript
     * // In topic.dita: <ph keyref="product-name"/>
     * const def = await resolver.resolveKey('product-name', '/path/to/topic.dita');
     *
     * if (def?.targetFile) {
     *     // Key resolves to another file
     *     console.log('Points to:', def.targetFile);
     * } else if (def?.inlineContent) {
     *     // Key has inline content
     *     console.log('Value:', def.inlineContent);
     * } else {
     *     console.log('Key not found or has no content');
     * }
     * ```
     */
    public async resolveKey(
        keyName: string,
        contextFilePath: string
    ): Promise<KeyDefinition | null> {
        // Find root map for the context file
        const rootMap = await this.findRootMap(contextFilePath);

        if (!rootMap) {
            logger.debug('No root map found for context file', { contextFile: contextFilePath });
            return null;
        }

        // Build key space
        const keySpace = await this.buildKeySpace(rootMap);

        // Context-aware resolution: when the authoring file lives inside a
        // named @keyscope, prefer the scope-qualified key (e.g.
        // "product.lib.version") over the root-level unqualified key
        // ("version"). The PushDown pass already added inherited ancestor
        // keys under the child scope namespace, so a child-scope override
        // always beats an ancestor definition at this lookup point.
        const scopePrefix = keySpace.topicToScope.get(this.normalizePathForComparison(contextFilePath));
        if (scopePrefix) {
            const qualifiedName = `${scopePrefix}.${keyName}`;
            const scopedDef = keySpace.keys.get(qualifiedName);
            if (scopedDef) {
                const resolved = this.followKeyrefChain(scopedDef, keySpace.keys, scopePrefix);
                logger.debug('Key resolved (scope-qualified)', {
                    keyName, scopePrefix, targetFile: resolved.targetFile
                });
                return resolved;
            }
        }

        // Fall back to the context-free (root-scope) entry, then follow any
        // @keyref chain to the final definition.
        const keyDef = keySpace.keys.get(keyName);

        if (keyDef) {
            const resolved = this.followKeyrefChain(keyDef, keySpace.keys, '');
            logger.debug('Key resolved', {
                keyName,
                targetFile: resolved.targetFile,
                sourceMap: path.basename(resolved.sourceMap)
            });
            return resolved;
        }

        // Deferred peer map resolution: keys in a peer map are only reachable
        // as "peerScopeName.actualKey" -- strip the first scope segment and
        // look up the remainder in the peer map's own key space.
        const dotIdx = keyName.indexOf('.');
        if (dotIdx > 0 && keySpace.deferredPeerMaps.size > 0) {
            const peerScopeName = keyName.slice(0, dotIdx);
            const peerKey = keyName.slice(dotIdx + 1);
            const peerMapPath = keySpace.deferredPeerMaps.get(peerScopeName);
            if (peerMapPath) {
                try {
                    const peerKeySpace = await this.buildKeySpace(peerMapPath);
                    const peerDef = peerKeySpace.keys.get(peerKey);
                    if (peerDef) {
                        const lastDot = peerKey.lastIndexOf('.');
                        const peerKeyScope = lastDot > 0 ? peerKey.slice(0, lastDot) : '';
                        const resolved = this.followKeyrefChain(peerDef, peerKeySpace.keys, peerKeyScope);
                        logger.debug('Key resolved (peer map)', { keyName, peerMapPath, targetFile: resolved.targetFile });
                        return resolved;
                    }
                } catch (error) {
                    logger.debug('Peer map not readable', { peerMapPath, error });
                }
            }
        }

        logger.debug('Key not found in key space', { keyName });
        return null;
    }

    /**
     * Find root map for a given file
     *
     * Discovers the root DITA map that governs key resolution for a given file.
     * This is essential because key definitions are scoped to their root map.
     *
     * ## Search Strategy
     * 1. Start from the directory containing the input file
     * 2. Search upward through parent directories
     * 3. Stop at workspace root (or filesystem root if no workspace)
     *
     * ## Map Selection Priority
     * When multiple maps exist in a directory, selects in order:
     * 1. `root.ditamap` (conventional name)
     * 2. `main.ditamap` (common alternative)
     * 3. `master.ditamap` (legacy name)
     * 4. First map alphabetically
     *
     * ## Caching
     * Results are cached by directory with 1-minute TTL to avoid expensive
     * directory scans during rapid operations (typing, multiple file opens).
     *
     * ## Performance Considerations
     * - Uses async `readdir` to avoid blocking the UI thread
     * - Cache key is the containing directory, not the input file
     * - Cache is invalidated when map files change (via file watcher)
     *
     * @param filePath - Absolute or relative path to any DITA file
     * @returns Promise resolving to absolute path to root map, or null if not found
     *
     * @example
     * ```typescript
     * // File: /project/docs/topics/intro.dita
     * // Maps: /project/docs/root.ditamap
     *
     * const rootMap = await resolver.findRootMap('/project/docs/topics/intro.dita');
     * // Returns: '/project/docs/root.ditamap'
     * ```
     */
    public async findRootMap(filePath: string): Promise<string | null> {
        const absolutePath = path.isAbsolute(filePath)
            ? filePath
            : path.resolve(filePath);

        const cacheKey = path.dirname(absolutePath);

        // Check cache first (avoids expensive directory scans)
        const cached = this.rootMapCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this.rootMapCacheTtl) {
            logger.debug('Root map cache hit', { directory: cacheKey });
            return cached.rootMap;
        }

        let currentDir = path.dirname(absolutePath);
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

        // Safety: Don't go above workspace root
        const stopDir = workspaceRoot || path.parse(currentDir).root;

        // Search up the directory tree to workspace root.
        // Root maps are typically at the project root, so we search all the way
        // up and prefer maps closest to the workspace root (highest level).
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

                    // Prefer conventional root map names
                    for (const preferred of preferredNames) {
                        if (mapFiles.includes(preferred)) {
                            found = path.join(currentDir, preferred);
                            break;
                        }
                    }

                    // Fall back to first alphabetically
                    if (!found) {
                        found = path.join(currentDir, mapFiles.sort()[0]);
                    }

                    // Higher directories overwrite lower — root maps live at project root
                    bestMap = found;
                }
            } catch (_error) {
                // Directory not readable
            }

            const parentDir = path.dirname(currentDir);
            if (parentDir === currentDir) {
                break; // Reached filesystem root
            }
            currentDir = parentDir;
        }

        if (!bestMap) {
            logger.debug('No root map found', { searchedFrom: absolutePath });
        }
        this.rootMapCache.set(cacheKey, { rootMap: bestMap, timestamp: Date.now() });
        return bestMap;
    }

    /**
     * Check if file exists asynchronously
     */
    private async fileExistsAsync(filePath: string): Promise<boolean> {
        try {
            await fsPromises.access(filePath, fs.constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Read file asynchronously
     */
    private async readFileAsync(filePath: string): Promise<string> {
        return fsPromises.readFile(filePath, 'utf-8');
    }

    /**
     * Get statistics about the key space cache
     */
    public getCacheStats(): {
        cacheSize: number;
        maxSize: number;
        ttlMs: number;
        entries: Array<{ rootMap: string; keyCount: number; mapCount: number; ageMs: number }>;
    } {
        const entries = Array.from(this.keySpaceCache.entries()).map(([rootMap, keySpace]) => ({
            rootMap: path.basename(rootMap),
            keyCount: keySpace.keys.size,
            mapCount: keySpace.mapHierarchy.length,
            ageMs: Date.now() - keySpace.buildTime
        }));

        return {
            cacheSize: this.keySpaceCache.size,
            maxSize: this.cacheConfig.maxSize,
            ttlMs: this.cacheConfig.ttlMs,
            entries
        };
    }

    /**
     * Clear all cached key spaces
     */
    public clearCache(): void {
        this.keySpaceCache.clear();
        this.rootMapCache.clear();
        logger.info('Key space cache cleared');
    }

    /**
     * Follow @keyref chains up to hopsRemaining hops.
     * Returns the original definition if no chain exists, the target is missing,
     * the hop limit is reached, or a cycle is detected.
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
        // Prefer the scope-qualified target so a keyref chain within a named
        // scope resolves to the scope's own override rather than the root definition.
        const next = (scopePrefix ? keys.get(`${scopePrefix}.${keyDef.keyref}`) : undefined)
            ?? keys.get(keyDef.keyref);
        if (!next) return keyDef;
        return this.followKeyrefChain(next, keys, scopePrefix, hopsRemaining - 1, visited);
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        // Clear debounce timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = undefined;
        }
        this.pendingInvalidations.clear();

        this.clearCache();
        this.disposables.forEach(d => d.dispose());
        logger.debug('KeySpaceResolver disposed');
    }
}
