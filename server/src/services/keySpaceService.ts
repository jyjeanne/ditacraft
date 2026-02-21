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
    /** Paths to subject scheme maps discovered during BFS traversal. */
    subjectSchemePaths: string[];
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

    /** Get the current workspace folder paths. */
    public getWorkspaceFolders(): readonly string[] {
        return this.workspaceFolders;
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
        return keySpace.keys.get(keyName) ?? null;
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

                // Detect subject scheme maps (root element is <subjectScheme>)
                if (this.isSubjectSchemeMap(rawContent)) {
                    keySpace.subjectSchemePaths.push(currentMap);
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

    private extractMapReferences(
        mapContent: string,
        mapPath: string,
        maxLinkMatches: number
    ): string[] {
        const submaps: string[] = [];
        const mapDir = path.dirname(mapPath);
        // Match ANY element with href pointing to a .ditamap or .bookmap file.
        // This covers mapref, topicref, chapter, appendix, part, glossarylist,
        // frontmatter, backmatter, notices, preface, topichead, anchorref, etc.
        const mapRefRegex = /<\w+[^>]*\bhref\s*=\s*["']([^"']+\.(?:ditamap|bookmap))["'][^>]*>/gi;

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
