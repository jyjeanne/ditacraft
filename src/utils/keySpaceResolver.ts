/**
 * Key Space Resolver
 * Resolves DITA key references by building a key space from map hierarchy
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
    keys: Map<string, KeyDefinition>;   // Key name → definition
    buildTime: number;                  // Timestamp when key space was built
    mapHierarchy: string[];             // All maps in hierarchy (in traversal order)
}

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

        const normalizedPath = path.normalize(absolutePath);
        return workspaceFolders.some(folder => {
            const normalizedWorkspace = path.normalize(folder.uri.fsPath);
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
            mapHierarchy: []
        };

        const visited = new Set<string>();
        const queue: string[] = [absoluteRootPath];

        // Breadth-first traversal of map hierarchy
        while (queue.length > 0) {
            const currentMap = queue.shift()!;
            const normalizedPath = path.normalize(currentMap);

            // Skip already visited maps (circular reference protection)
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
                // Read and parse current map
                const mapContent = await this.readFileAsync(currentMap);

                // Extract key definitions
                const keys = this.extractKeyDefinitions(mapContent, currentMap);

                // First definition wins (key precedence)
                for (const keyDef of keys) {
                    if (!keySpace.keys.has(keyDef.keyName)) {
                        keySpace.keys.set(keyDef.keyName, keyDef);
                        logger.debug('Added key definition', {
                            key: keyDef.keyName,
                            source: path.basename(currentMap)
                        });
                    }
                }

                // Find and queue submaps
                const submaps = this.extractMapReferences(mapContent, currentMap);
                queue.push(...submaps);

            } catch (error) {
                logger.error('Error parsing map file', { map: currentMap, error });
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
    private extractMapReferences(mapContent: string, mapPath: string): string[] {
        const submaps: string[] = [];
        const mapDir = path.dirname(mapPath);

        // Pattern to match mapref elements or any element referencing another map
        // Matches: <mapref href="...ditamap">, <topicref href="...ditamap">, etc.
        const mapRefRegex = /<(?:mapref|topicref|chapter|appendix|part)[^>]*\bhref\s*=\s*["']([^"']+\.(?:ditamap|bookmap))["'][^>]*>/gi;

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
                submaps.push(absolutePath);
            } else {
                logger.warn('Map reference outside workspace blocked', { href, mapPath });
            }
        }

        return submaps;
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

        // Lookup key
        const keyDef = keySpace.keys.get(keyName);

        if (keyDef) {
            logger.debug('Key resolved', {
                keyName,
                targetFile: keyDef.targetFile,
                sourceMap: path.basename(keyDef.sourceMap)
            });
        } else {
            logger.debug('Key not found in key space', { keyName });
        }

        return keyDef || null;
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

        // Search up the directory tree
        while (currentDir && currentDir.length >= stopDir.length) {
            // Look for .ditamap or .bookmap files in current directory
            try {
                // Use async readdir to avoid blocking UI thread
                const files = await fsPromises.readdir(currentDir);
                const mapFiles = files.filter(f =>
                    f.endsWith('.ditamap') || f.endsWith('.bookmap')
                );

                if (mapFiles.length > 0) {
                    // Prefer root.ditamap, main.ditamap, or first alphabetically
                    const preferredNames = ['root.ditamap', 'main.ditamap', 'master.ditamap'];

                    for (const preferred of preferredNames) {
                        if (mapFiles.includes(preferred)) {
                            const result = path.join(currentDir, preferred);
                            this.rootMapCache.set(cacheKey, { rootMap: result, timestamp: Date.now() });
                            return result;
                        }
                    }

                    // Return first map file found
                    const result = path.join(currentDir, mapFiles.sort()[0]);
                    this.rootMapCache.set(cacheKey, { rootMap: result, timestamp: Date.now() });
                    return result;
                }
            } catch (_error) {
                // Directory not readable
            }

            // Move to parent directory
            const parentDir = path.dirname(currentDir);
            if (parentDir === currentDir) {
                break; // Reached root
            }
            currentDir = parentDir;
        }

        logger.debug('No root map found', { searchedFrom: absolutePath });
        this.rootMapCache.set(cacheKey, { rootMap: null, timestamp: Date.now() });
        return null;
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
