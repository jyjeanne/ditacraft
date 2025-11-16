/**
 * Key Space Resolver
 * Resolves DITA key references by building a key space from map hierarchy
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from './logger';

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
    private fileWatcher: vscode.FileSystemWatcher | undefined;
    private cacheConfig: CacheConfig;
    private disposables: vscode.Disposable[] = [];

    constructor() {
        this.cacheConfig = {
            ttlMs: 5 * 60 * 1000,  // 5 minutes
            maxSize: 10             // Max 10 root maps
        };

        // Set up file watcher for map files
        this.setupFileWatcher();

        logger.debug('KeySpaceResolver initialized');
    }

    /**
     * Set up file system watcher for map files
     */
    private setupFileWatcher(): void {
        // Watch for changes to .ditamap and .bookmap files
        this.fileWatcher = vscode.workspace.createFileSystemWatcher(
            '**/*.{ditamap,bookmap}',
            false,  // Don't ignore creates
            false,  // Don't ignore changes
            false   // Don't ignore deletes
        );

        // Invalidate cache when maps change
        this.fileWatcher.onDidChange(uri => {
            logger.debug('Map file changed, invalidating cache', { file: uri.fsPath });
            this.invalidateCacheForFile(uri.fsPath);
        });

        this.fileWatcher.onDidCreate(uri => {
            logger.debug('Map file created, invalidating cache', { file: uri.fsPath });
            this.invalidateCacheForFile(uri.fsPath);
        });

        this.fileWatcher.onDidDelete(uri => {
            logger.debug('Map file deleted, invalidating cache', { file: uri.fsPath });
            this.invalidateCacheForFile(uri.fsPath);
        });

        this.disposables.push(this.fileWatcher);
    }

    /**
     * Invalidate cache entries that include the changed file
     */
    private invalidateCacheForFile(changedFile: string): void {
        const normalizedPath = path.normalize(changedFile);

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
     * Uses breadth-first traversal to respect key precedence (first definition wins)
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

            // Check if file exists
            if (!fs.existsSync(currentMap)) {
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
     * Cache a key space with LRU eviction
     */
    private cacheKeySpace(keySpace: KeySpace): void {
        // Evict oldest entries if cache is full
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
     * Extract key definitions from map content
     */
    private extractKeyDefinitions(mapContent: string, mapPath: string): KeyDefinition[] {
        const keys: KeyDefinition[] = [];
        const mapDir = path.dirname(mapPath);

        // Regex to match keydef elements or any element with @keys attribute
        // Pattern: <keydef keys="..." or <topicref keys="..." etc.
        const keydefRegex = /<(\w+)[^>]*\bkeys\s*=\s*["']([^"']+)["'][^>]*>/gi;

        let match: RegExpExecArray | null;
        let matchCount = 0;
        const maxMatches = 10000;

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
                            keyDef.targetFile = path.resolve(mapDir, filePart);
                        }
                        if (elementId) {
                            keyDef.elementId = elementId;
                        }
                    } else if (!href.startsWith('http://') && !href.startsWith('https://')) {
                        // Resolve relative path
                        keyDef.targetFile = path.resolve(mapDir, href);
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
        const maxMatches = 1000;

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
            submaps.push(absolutePath);
        }

        return submaps;
    }

    /**
     * Resolve a key name to its definition
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
     * Strategy: Look for .ditamap files in the same directory and parent directories
     */
    public async findRootMap(filePath: string): Promise<string | null> {
        const absolutePath = path.isAbsolute(filePath)
            ? filePath
            : path.resolve(filePath);

        let currentDir = path.dirname(absolutePath);
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

        // Safety: Don't go above workspace root
        const stopDir = workspaceRoot || path.parse(currentDir).root;

        // Search up the directory tree
        while (currentDir && currentDir.length >= stopDir.length) {
            // Look for .ditamap or .bookmap files in current directory
            try {
                const files = fs.readdirSync(currentDir);
                const mapFiles = files.filter(f =>
                    f.endsWith('.ditamap') || f.endsWith('.bookmap')
                );

                if (mapFiles.length > 0) {
                    // Prefer root.ditamap, main.ditamap, or first alphabetically
                    const preferredNames = ['root.ditamap', 'main.ditamap', 'master.ditamap'];

                    for (const preferred of preferredNames) {
                        if (mapFiles.includes(preferred)) {
                            return path.join(currentDir, preferred);
                        }
                    }

                    // Return first map file found
                    return path.join(currentDir, mapFiles.sort()[0]);
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
        return null;
    }

    /**
     * Read file asynchronously
     */
    private async readFileAsync(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf-8', (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
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
        logger.info('Key space cache cleared');
    }

    /**
     * Dispose of resources
     */
    public dispose(): void {
        this.clearCache();
        this.disposables.forEach(d => d.dispose());
        logger.debug('KeySpaceResolver disposed');
    }
}
