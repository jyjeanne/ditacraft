/**
 * Subject Scheme Service (Phase 7).
 * Parses DITA subject scheme maps to determine controlled attribute values.
 */

import * as fs from 'fs';
import { ISubjectSchemeService } from './interfaces';

// --- Interfaces ---

export interface SubjectDefinition {
    keys: Set<string>;
    navtitle: string | null;
    children: SubjectDefinition[];
}

export interface SubjectSchemeData {
    /** attributeName → (elementName → Set<validValues>) */
    validValuesMap: Map<string, Map<string, Set<string>>>;
    /** attributeName → (elementName → defaultValue) */
    defaultValueMap: Map<string, Map<string, string>>;
    /** key → hierarchy path (e.g., "Platform > Linux > Ubuntu") */
    hierarchyPaths: Map<string, string>;
}

const ANY_ELEMENT = '*';

/**
 * Read-only query surface over subject scheme data. Implemented both by the
 * shared service (global registered state) and by per-document snapshots
 * returned from snapshotFor(), which are immune to concurrent re-registration.
 */
export interface SubjectSchemeQueries {
    hasSchemeData(): boolean;
    isControlledAttribute(attributeName: string): boolean;
    getValidValues(attributeName: string, elementName?: string): Set<string> | null;
    getDefaultValue(attributeName: string, elementName?: string): string | null;
    getHierarchyPath(key: string): string | null;
}

/**
 * Immutable view over an explicitly merged scheme set.
 * This is the single implementation of the scheme lookups — the service's own
 * query methods delegate to a lazily built snapshot of its registered state,
 * so validation (per-document snapshots) and completion/hover (shared state)
 * can never drift apart.
 */
class SubjectSchemeSnapshot implements SubjectSchemeQueries {
    constructor(
        private readonly data: SubjectSchemeData,
        private readonly hasSchemes: boolean,
    ) {}

    hasSchemeData(): boolean {
        return this.hasSchemes;
    }

    isControlledAttribute(attributeName: string): boolean {
        return this.data.validValuesMap.has(attributeName);
    }

    getValidValues(attributeName: string, elementName?: string): Set<string> | null {
        const elements = this.data.validValuesMap.get(attributeName);
        if (!elements) return null;
        if (elementName) {
            return elements.get(elementName) || elements.get(ANY_ELEMENT) || null;
        }
        return elements.get(ANY_ELEMENT) || null;
    }

    getDefaultValue(attributeName: string, elementName?: string): string | null {
        const elements = this.data.defaultValueMap.get(attributeName);
        if (!elements) return null;
        if (elementName) {
            return elements.get(elementName) ?? elements.get(ANY_ELEMENT) ?? null;
        }
        return elements.get(ANY_ELEMENT) ?? null;
    }

    getHierarchyPath(key: string): string | null {
        return this.data.hierarchyPaths.get(key) ?? null;
    }
}

// --- Service ---

export class SubjectSchemeService implements ISubjectSchemeService {
    private cache: Map<string, { data: SubjectSchemeData; timestamp: number }> = new Map();
    private cacheTtlMs = 5 * 60 * 1000;

    /** All currently registered scheme paths. */
    private registeredSchemes: string[] = [];

    /** Merged scheme data from all registered schemes. */
    private mergedData: SubjectSchemeData | null = null;

    /** Lazily built snapshot over mergedData; the service's query methods delegate to it. */
    private mergedSnapshot: SubjectSchemeSnapshot | null = null;

    /** Memoized per-scheme-set snapshots, keyed by the path list. */
    private snapshotCache: Map<string, { snapshot: SubjectSchemeSnapshot; timestamp: number }> = new Map();

    /**
     * Register subject scheme map paths discovered during key space build.
     * Clears merged cache so next lookup re-merges.
     */
    registerSchemes(schemePaths: string[]): void {
        const changed = schemePaths.length !== this.registeredSchemes.length
            || schemePaths.some((p, i) => p !== this.registeredSchemes[i]);
        if (changed) {
            this.registeredSchemes = [...schemePaths];
            this.mergedData = null; // force re-merge
            this.mergedSnapshot = null;
            this.cache.clear(); // clear per-file cache to avoid stale data from old scheme paths
            this.snapshotCache.clear(); // memoized snapshots were built from that cache
        }
    }

    /**
     * Parse a subject scheme map file and return the controlled value data.
     */
    parseSubjectScheme(mapFilePath: string): SubjectSchemeData {
        const cached = this.cache.get(mapFilePath);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTtlMs) {
            return cached.data;
        }

        let content: string;
        try {
            content = fs.readFileSync(mapFilePath, 'utf-8');
        } catch {
            const empty: SubjectSchemeData = {
                validValuesMap: new Map(),
                defaultValueMap: new Map(),
                hierarchyPaths: new Map(),
            };
            return empty;
        }

        const subjectDefs = this.extractSubjectDefinitions(content);
        const data: SubjectSchemeData = {
            validValuesMap: new Map(),
            defaultValueMap: new Map(),
            hierarchyPaths: new Map(),
        };

        // Build hierarchy paths for all subject definitions (deduplicate shared defs)
        const visited = new Set<SubjectDefinition>();
        for (const def of subjectDefs.values()) {
            if (!visited.has(def)) {
                visited.add(def);
                this.buildHierarchyPaths(def, [], data.hierarchyPaths);
            }
        }

        this.processEnumerationDefs(content, subjectDefs, data);
        this.cache.set(mapFilePath, { data, timestamp: Date.now() });
        return data;
    }

    /**
     * Get merged scheme data from all registered schemes.
     * Parses and merges lazily on first access after registration.
     */
    getMergedSchemeData(): SubjectSchemeData {
        if (this.mergedData) {
            return this.mergedData;
        }
        this.mergedData = this.mergeSchemes(this.registeredSchemes);
        return this.mergedData;
    }

    /**
     * Build a read-only snapshot for an explicit scheme set. Unlike the
     * service's own query methods, the snapshot is not affected by later
     * registerSchemes() calls from concurrently validating documents.
     * Per-file parse results are shared via the internal cache, so this is cheap.
     */
    snapshotFor(schemePaths: string[]): SubjectSchemeQueries {
        const key = schemePaths.join('\u0000');
        const hit = this.snapshotCache.get(key);
        if (hit && (Date.now() - hit.timestamp) < this.cacheTtlMs) {
            return hit.snapshot;
        }
        const snapshot = new SubjectSchemeSnapshot(this.mergeSchemes(schemePaths), schemePaths.length > 0);
        if (this.snapshotCache.size >= 20) {
            this.snapshotCache.clear(); // tiny cache; wholesale reset is fine
        }
        this.snapshotCache.set(key, { snapshot, timestamp: Date.now() });
        return snapshot;
    }

    /**
     * Parse and merge an explicit scheme path list into raw
     * `SubjectSchemeData`, without touching the shared registered state —
     * the same pure lookup `snapshotFor()` uses internally, exposed for
     * callers (the DITAVAL condition editor) that need the raw
     * `validValuesMap`/`hierarchyPaths` structure to *enumerate* every
     * controlled attribute/value pair, rather than the narrower
     * `SubjectSchemeQueries` lookup-by-name surface `snapshotFor()` returns.
     */
    getSchemeData(schemePaths: string[]): SubjectSchemeData {
        return this.mergeSchemes(schemePaths);
    }

    /** Parse and merge an explicit list of scheme maps (pure — no service state mutation). */
    private mergeSchemes(schemePaths: string[]): SubjectSchemeData {
        const merged: SubjectSchemeData = {
            validValuesMap: new Map(),
            defaultValueMap: new Map(),
            hierarchyPaths: new Map(),
        };

        for (const schemePath of schemePaths) {
            const data = this.parseSubjectScheme(schemePath);
            // Merge hierarchy paths (first-definition-wins)
            for (const [key, pathStr] of data.hierarchyPaths) {
                if (!merged.hierarchyPaths.has(key)) {
                    merged.hierarchyPaths.set(key, pathStr);
                }
            }
            // Merge valid values
            for (const [attr, elements] of data.validValuesMap) {
                if (!merged.validValuesMap.has(attr)) {
                    merged.validValuesMap.set(attr, new Map());
                }
                const mergedElements = merged.validValuesMap.get(attr)!;
                for (const [elem, values] of elements) {
                    if (!mergedElements.has(elem)) {
                        mergedElements.set(elem, new Set());
                    }
                    const mergedValues = mergedElements.get(elem)!;
                    for (const v of values) mergedValues.add(v);
                }
            }
            // Merge defaults (first-definition-wins)
            for (const [attr, elements] of data.defaultValueMap) {
                if (!merged.defaultValueMap.has(attr)) {
                    merged.defaultValueMap.set(attr, new Map());
                }
                const mergedElements = merged.defaultValueMap.get(attr)!;
                for (const [elem, val] of elements) {
                    if (!mergedElements.has(elem)) {
                        mergedElements.set(elem, val);
                    }
                }
            }
        }

        return merged;
    }

    /** Lazily built snapshot over the registered scheme state; the single
     *  implementation of the lookups lives in SubjectSchemeSnapshot. */
    private getMergedSnapshot(): SubjectSchemeSnapshot {
        if (!this.mergedSnapshot) {
            this.mergedSnapshot = new SubjectSchemeSnapshot(
                this.getMergedSchemeData(),
                this.registeredSchemes.length > 0,
            );
        }
        return this.mergedSnapshot;
    }

    /**
     * Look up valid values for an attribute on an element.
     * Falls back to wildcard '*' if no element-specific binding exists.
     */
    getValidValues(attributeName: string, elementName?: string): Set<string> | null {
        return this.getMergedSnapshot().getValidValues(attributeName, elementName);
    }

    /**
     * Check if an attribute is controlled by a subject scheme.
     */
    isControlledAttribute(attributeName: string): boolean {
        return this.getMergedSnapshot().isControlledAttribute(attributeName);
    }

    /**
     * Get the hierarchy path for a subject key (e.g., "Platform > Linux > Ubuntu").
     */
    getHierarchyPath(key: string): string | null {
        return this.getMergedSnapshot().getHierarchyPath(key);
    }

    /**
     * Get the default value for an attribute on an element.
     */
    getDefaultValue(attributeName: string, elementName?: string): string | null {
        return this.getMergedSnapshot().getDefaultValue(attributeName, elementName);
    }

    /** Check if any scheme data is available. */
    hasSchemeData(): boolean {
        return this.registeredSchemes.length > 0;
    }

    /** Invalidate a specific scheme file's cache. */
    invalidate(filePath: string): void {
        this.cache.delete(filePath);
        this.mergedData = null;
        this.mergedSnapshot = null;
        this.snapshotCache.clear();
    }

    /** Clear all caches. */
    shutdown(): void {
        this.cache.clear();
        this.registeredSchemes = [];
        this.mergedData = null;
        this.mergedSnapshot = null;
        this.snapshotCache.clear();
    }

    // --- Internal: Parsing ---

    private extractSubjectDefinitions(
        content: string
    ): Map<string, SubjectDefinition> {
        const defs = new Map<string, SubjectDefinition>();
        const children = this.parseSubjectDefs(content);
        for (const def of children) {
            for (const key of def.keys) {
                if (!defs.has(key)) {
                    defs.set(key, def);
                }
            }
        }
        return defs;
    }

    /**
     * Parse <subjectdef> elements from content using depth-aware scanning
     * to handle nested elements correctly.
     */
    private parseSubjectDefs(content: string): SubjectDefinition[] {
        const results: SubjectDefinition[] = [];
        const openRegex = /<subjectdef\b([^>]*?)(\/?)>/g;
        let match: RegExpExecArray | null;

        while ((match = openRegex.exec(content)) !== null) {
            const attrs = match[1];
            const selfClosing = match[2] === '/';

            const keysMatch = /\bkeys\s*=\s*["']([^"']+)["']/.exec(attrs);
            const keys = keysMatch
                ? new Set(keysMatch[1].trim().split(/\s+/))
                : new Set<string>();
            const navtitleMatch = /\bnavtitle\s*=\s*["']([^"']+)["']/.exec(attrs);
            const navtitle = navtitleMatch ? navtitleMatch[1] : null;

            let children: SubjectDefinition[] = [];

            if (!selfClosing) {
                // Find matching </subjectdef> using depth tracking
                const innerStart = match.index + match[0].length;
                const innerEnd = this.findClosingTag(content, innerStart, 'subjectdef');
                if (innerEnd !== -1) {
                    const innerContent = content.substring(innerStart, innerEnd);
                    children = this.parseSubjectDefs(innerContent);
                    // Advance past the closing tag
                    openRegex.lastIndex = innerEnd + '</subjectdef>'.length;
                }
            }

            results.push({ keys, navtitle, children });
        }

        return results;
    }

    /**
     * Find the position of the matching closing tag, respecting nesting depth.
     * Returns the offset of the start of the closing tag, or -1 if not found.
     */
    private findClosingTag(content: string, startPos: number, tagName: string): number {
        let depth = 1;
        const openPattern = new RegExp(`<${tagName}\\b[^>]*?(/?)>`, 'g');
        const closePattern = new RegExp(`</${tagName}>`, 'g');

        // Collect all open and close positions after startPos
        const events: { pos: number; isOpen: boolean; length: number }[] = [];

        openPattern.lastIndex = startPos;
        closePattern.lastIndex = startPos;

        let m: RegExpExecArray | null;
        while ((m = openPattern.exec(content)) !== null) {
            if (m[1] !== '/') { // Not self-closing
                events.push({ pos: m.index, isOpen: true, length: m[0].length });
            }
        }
        while ((m = closePattern.exec(content)) !== null) {
            events.push({ pos: m.index, isOpen: false, length: m[0].length });
        }

        events.sort((a, b) => a.pos - b.pos);

        for (const ev of events) {
            if (ev.isOpen) {
                depth++;
            } else {
                depth--;
                if (depth === 0) {
                    return ev.pos;
                }
            }
        }

        return -1;
    }

    private processEnumerationDefs(
        content: string,
        subjectDefs: Map<string, SubjectDefinition>,
        data: SubjectSchemeData
    ): void {
        const enumRegex = /<enumerationdef\b[^>]*>([\s\S]*?)<\/enumerationdef>/g;
        let match;
        while ((match = enumRegex.exec(content)) !== null) {
            const enumContent = match[1];

            // Extract element name (from <elementdef name="...">)
            const elemDefMatch = /<elementdef\b[^>]*\bname\s*=\s*["']([^"']+)["']/.exec(enumContent);
            const elementName = elemDefMatch ? elemDefMatch[1] : ANY_ELEMENT;

            // Extract attribute name (from <attributedef name="...">)
            const attrDefMatch = /<attributedef\b[^>]*\bname\s*=\s*["']([^"']+)["']/.exec(enumContent);
            if (!attrDefMatch) continue;
            const attributeName = attrDefMatch[1];

            // Extract default subject
            const defaultMatch = /<defaultSubject\b[^>]*\bkeyref\s*=\s*["']([^"']+)["']/.exec(enumContent);
            if (defaultMatch) {
                if (!data.defaultValueMap.has(attributeName)) {
                    data.defaultValueMap.set(attributeName, new Map());
                }
                data.defaultValueMap.get(attributeName)!.set(elementName, defaultMatch[1]);
            }

            // Collect valid values from <subjectdef> references in the enumeration
            const valueSet = new Set<string>();
            const childSubjRegex = /<subjectdef\b[^>]*(?:keyref|keys)\s*=\s*["']([^"']+)["']/g;
            let subjMatch;
            while ((subjMatch = childSubjRegex.exec(enumContent)) !== null) {
                const keyValues = subjMatch[1].trim().split(/\s+/);
                for (const keyValue of keyValues) {
                    const subTree = subjectDefs.get(keyValue);
                    if (subTree) {
                        this.flattenKeys(subTree, valueSet);
                    } else {
                        // Direct reference to a key not in subjectdef tree — add it directly
                        valueSet.add(keyValue);
                    }
                }
            }

            if (valueSet.size > 0) {
                if (!data.validValuesMap.has(attributeName)) {
                    data.validValuesMap.set(attributeName, new Map());
                }
                data.validValuesMap.get(attributeName)!.set(elementName, valueSet);
            }
        }
    }

    /**
     * Build hierarchy paths for subject definitions.
     * E.g., for a tree "Platform > Linux > Ubuntu", stores "Platform > Linux > Ubuntu" for key "ubuntu".
     */
    private buildHierarchyPaths(
        def: SubjectDefinition,
        parentPath: string[],
        result: Map<string, string>
    ): void {
        // Use navtitle as the canonical label; fall back to first key
        const label = def.navtitle || (def.keys.size > 0 ? [...def.keys][0] : '');
        const currentPath = label ? [...parentPath, label] : parentPath;

        for (const key of def.keys) {
            if (currentPath.length > 0) {
                result.set(key, currentPath.join(' > '));
            }
        }

        for (const child of def.children) {
            this.buildHierarchyPaths(child, currentPath, result);
        }
    }

    /** Flatten a subject definition tree, collecting all keys from the tree. */
    private flattenKeys(
        def: SubjectDefinition,
        result: Set<string>
    ): void {
        for (const key of def.keys) {
            result.add(key);
        }
        for (const child of def.children) {
            this.flattenKeys(child, result);
        }
    }
}
