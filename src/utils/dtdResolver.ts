/**
 * DTD Catalog Resolver
 * Resolves DITA PUBLIC IDs to local DTD files
 */

import * as path from 'path';
import * as fs from 'fs';
import { logger } from './logger';

export class DtdResolver {
    private dtdCache: Map<string, string> = new Map();
    private catalogMap: Map<string, string> = new Map();
    private dtdBasePath: string;

    constructor(extensionPath: string) {
        this.dtdBasePath = path.join(extensionPath, 'dtds');
        this.loadCatalog();
    }

    /**
     * Load and parse DITA catalog files to build PUBLIC ID mappings
     */
    private loadCatalog(): void {
        // Common DITA 1.3 PUBLIC IDs and their file mappings
        const catalogMappings: Array<{ publicId: string; uri: string }> = [
            // Topic types
            { publicId: '-//OASIS//DTD DITA Topic//EN', uri: 'technicalContent/dtd/topic.dtd' },
            { publicId: '-//OASIS//DTD DITA 1.3 Topic//EN', uri: 'technicalContent/dtd/topic.dtd' },
            { publicId: '-//OASIS//DTD DITA Concept//EN', uri: 'technicalContent/dtd/concept.dtd' },
            { publicId: '-//OASIS//DTD DITA 1.3 Concept//EN', uri: 'technicalContent/dtd/concept.dtd' },
            { publicId: '-//OASIS//DTD DITA Task//EN', uri: 'technicalContent/dtd/task.dtd' },
            { publicId: '-//OASIS//DTD DITA 1.3 Task//EN', uri: 'technicalContent/dtd/task.dtd' },
            { publicId: '-//OASIS//DTD DITA Reference//EN', uri: 'technicalContent/dtd/reference.dtd' },
            { publicId: '-//OASIS//DTD DITA 1.3 Reference//EN', uri: 'technicalContent/dtd/reference.dtd' },
            { publicId: '-//OASIS//DTD DITA Glossary Entry//EN', uri: 'technicalContent/dtd/glossentry.dtd' },
            { publicId: '-//OASIS//DTD DITA 1.3 Glossary Entry//EN', uri: 'technicalContent/dtd/glossentry.dtd' },

            // Map types
            { publicId: '-//OASIS//DTD DITA Map//EN', uri: 'technicalContent/dtd/map.dtd' },
            { publicId: '-//OASIS//DTD DITA 1.3 Map//EN', uri: 'technicalContent/dtd/map.dtd' },
            { publicId: '-//OASIS//DTD DITA BookMap//EN', uri: 'bookmap/dtd/bookmap.dtd' },
            { publicId: '-//OASIS//DTD DITA 1.3 BookMap//EN', uri: 'bookmap/dtd/bookmap.dtd' },

            // Base types
            { publicId: '-//OASIS//DTD DITA Base Topic//EN', uri: 'base/dtd/basetopic.dtd' },
            { publicId: '-//OASIS//DTD DITA 1.3 Base Topic//EN', uri: 'base/dtd/basetopic.dtd' },
            { publicId: '-//OASIS//DTD DITA Base Map//EN', uri: 'base/dtd/basemap.dtd' },
            { publicId: '-//OASIS//DTD DITA 1.3 Base Map//EN', uri: 'base/dtd/basemap.dtd' }
        ];

        // Build catalog map
        for (const mapping of catalogMappings) {
            const fullPath = path.join(this.dtdBasePath, mapping.uri);
            if (fs.existsSync(fullPath)) {
                this.catalogMap.set(mapping.publicId, fullPath);
            }
        }
    }

    /**
     * Resolve a PUBLIC ID to a local DTD file path
     */
    public resolvePublicId(publicId: string): string | null {
        return this.catalogMap.get(publicId) || null;
    }

    /**
     * Get DTD content from cache or load from file
     */
    public getDtdContent(publicId: string): string | null {
        // Check cache first
        if (this.dtdCache.has(publicId)) {
            return this.dtdCache.get(publicId)!;
        }

        // Resolve to file path
        const dtdPath = this.resolvePublicId(publicId);
        if (!dtdPath || !fs.existsSync(dtdPath)) {
            return null;
        }

        try {
            // Load DTD content
            const content = fs.readFileSync(dtdPath, 'utf-8');
            this.dtdCache.set(publicId, content);
            return content;
        } catch (error) {
            logger.error('Failed to load DTD', { dtdPath, error });
            return null;
        }
    }

    /**
     * Resolve external entity references
     * This is needed for DTD files that reference other .ent and .mod files
     */
    public resolveEntity(publicId: string | null, systemId: string | null): string | null {
        // Try PUBLIC ID first
        if (publicId) {
            const resolved = this.resolvePublicId(publicId);
            if (resolved) {
                return resolved;
            }
        }

        // Try SYSTEM ID (relative path)
        if (systemId) {
            // System IDs in DITA DTDs are typically relative paths
            // We need to resolve them relative to the DTD base path
            const relativePath = systemId.replace(/^.*\/dtd\//, '');

            // Try different base paths
            const searchPaths = [
                path.join(this.dtdBasePath, 'technicalContent', 'dtd', relativePath),
                path.join(this.dtdBasePath, 'base', 'dtd', relativePath),
                path.join(this.dtdBasePath, 'bookmap', 'dtd', relativePath)
            ];

            for (const searchPath of searchPaths) {
                if (fs.existsSync(searchPath)) {
                    return searchPath;
                }
            }
        }

        return null;
    }

    /**
     * Get base DTD path for relative resolution
     */
    public getDtdBasePath(): string {
        return this.dtdBasePath;
    }

    /**
     * Check if DTD files are available
     */
    public areDtdsAvailable(): boolean {
        return this.catalogMap.size > 0;
    }
}
