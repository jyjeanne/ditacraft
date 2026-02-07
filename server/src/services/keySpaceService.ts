/**
 * Server-side Key Space Service.
 * Resolves DITA key references by building a key space from map hierarchies.
 * Ported from client-side src/utils/keySpaceResolver.ts with VS Code
 * dependencies replaced by injected callbacks.
 */

import * as path from 'path';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';

// --- Interfaces ---

export interface KeyDefinition {
    keyName: string;
    targetFile?: string;
    elementId?: string;
    inlineContent?: string;
    sourceMap: string;
    scope?: string;
    processingRole?: string;
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
const ROOT_MAP_CACHE_TTL_MS = ONE_MINUTE_MS;
const FILE_WATCHER_DEBOUNCE_MS = 300;
const MIN_CLEANUP_INTERVAL_MS = 5 * ONE_MINUTE_MS;
const CACHE_CLEANUP_RATIO = 3;

// --- Service ---

export class KeySpaceService {
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
        return keySpace.keys.get(keyName) ?? null;
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
     * Priority: root.ditamap > main.ditamap > master.ditamap > first alphabetically.
     */
    public async findRootMap(filePath: string): Promise<string | null> {
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

        while (currentDir && currentDir.length >= stopDir.length) {
            try {
                const files = await fsPromises.readdir(currentDir);
                const mapFiles = files.filter(f =>
                    f.endsWith('.ditamap') || f.endsWith('.bookmap')
                );

                if (mapFiles.length > 0) {
                    const preferredNames = ['root.ditamap', 'main.ditamap', 'master.ditamap'];
                    for (const preferred of preferredNames) {
                        if (mapFiles.includes(preferred)) {
                            const result = path.join(currentDir, preferred);
                            this.rootMapCache.set(cacheKey, { rootMap: result, timestamp: Date.now() });
                            return result;
                        }
                    }
                    const result = path.join(currentDir, mapFiles.sort()[0]);
                    this.rootMapCache.set(cacheKey, { rootMap: result, timestamp: Date.now() });
                    return result;
                }
            } catch {
                // Directory not readable
            }

            const parentDir = path.dirname(currentDir);
            if (parentDir === currentDir) break;
            currentDir = parentDir;
        }

        this.rootMapCache.set(cacheKey, { rootMap: null, timestamp: Date.now() });
        return null;
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
        };

        const visited = new Set<string>();
        const queue: string[] = [absoluteRootPath];
        let maxLinkMatches = 10000;

        try {
            const settings = await this.getSettings();
            maxLinkMatches = settings.maxLinkMatches;
        } catch {
            // Use default
        }

        while (queue.length > 0) {
            const currentMap = queue.shift()!;
            const normalizedPath = path.normalize(currentMap);

            if (visited.has(normalizedPath)) continue;

            const fileExists = await this.fileExistsAsync(currentMap);
            if (!fileExists) continue;

            visited.add(normalizedPath);
            keySpace.mapHierarchy.push(currentMap);

            try {
                const rawContent = await fsPromises.readFile(currentMap, 'utf-8');
                // Strip comments and CDATA to avoid false matches
                const mapContent = this.stripCommentsAndCdata(rawContent);

                // Extract key definitions — first definition wins
                const keys = this.extractKeyDefinitions(mapContent, currentMap, maxLinkMatches);
                for (const keyDef of keys) {
                    if (!keySpace.keys.has(keyDef.keyName)) {
                        keySpace.keys.set(keyDef.keyName, keyDef);
                    }
                }

                // Queue submaps
                const submaps = this.extractMapReferences(mapContent, currentMap, maxLinkMatches);
                queue.push(...submaps);
            } catch {
                // Error reading/parsing map, skip
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

        const keydefRegex = /<(\w+)[^>]*\bkeys\s*=\s*["']([^"']+)["'][^>]*>/gi;
        let match: RegExpExecArray | null;
        let matchCount = 0;

        while ((match = keydefRegex.exec(mapContent)) !== null) {
            if (++matchCount > maxMatches) break;

            const keysValue = match[2];
            const fullElement = match[0];
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

                // Inline content (keydef without href)
                if (!keyDef.targetFile) {
                    const inline = this.extractInlineContent(mapContent, match.index);
                    if (inline) keyDef.inlineContent = inline;
                }

                keys.push(keyDef);
            }
        }

        return keys;
    }

    private extractInlineContent(mapContent: string, startIndex: number): string | null {
        const afterElement = mapContent.substring(startIndex);
        const keywordMatch = afterElement.match(
            /<topicmeta[^>]*>[\s\S]*?<keyword[^>]*>([^<]+)<\/keyword>/i
        );
        return keywordMatch ? keywordMatch[1].trim() : null;
    }

    private extractMapReferences(
        mapContent: string,
        mapPath: string,
        maxLinkMatches: number
    ): string[] {
        const submaps: string[] = [];
        const mapDir = path.dirname(mapPath);
        const mapRefRegex = /<(?:mapref|topicref|chapter|appendix|part)[^>]*\bhref\s*=\s*["']([^"']+\.(?:ditamap|bookmap))["'][^>]*>/gi;

        let match: RegExpExecArray | null;
        let matchCount = 0;
        const maxMatches = Math.max(MAX_MAP_REFERENCES, Math.floor(maxLinkMatches / 10));

        while ((match = mapRefRegex.exec(mapContent)) !== null) {
            if (++matchCount > maxMatches) break;

            const href = match[1];
            if (href.startsWith('http://') || href.startsWith('https://')) continue;

            const absolutePath = path.resolve(mapDir, href);
            if (this.isPathWithinWorkspace(absolutePath)) {
                submaps.push(absolutePath);
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

    /** Replace comment and CDATA content with spaces (preserves offsets). */
    private stripCommentsAndCdata(text: string): string {
        return text
            .replace(/<!--[\s\S]*?-->/g, (m) => ' '.repeat(m.length))
            .replace(/<!\[CDATA\[[\s\S]*?]]>/g, (m) => ' '.repeat(m.length));
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

    private async fileExistsAsync(filePath: string): Promise<boolean> {
        try {
            await fsPromises.access(filePath, fs.constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }
}
