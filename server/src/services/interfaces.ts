/**
 * Service interfaces for the main DitaCraft LSP services.
 * Defines the public API contracts used by consumers to improve
 * testability and decoupling.
 */

import { Diagnostic } from 'vscode-languageserver/node';
import { KeyDefinition, KeyResolutionReport, KeySpace } from './keySpaceService';
export type { KeyResolutionReport };

// ---------------------------------------------------------------------------
// IKeySpaceService
// ---------------------------------------------------------------------------

export interface IKeySpaceService {
    /** Get the current workspace folder paths. */
    getWorkspaceFolders(): readonly string[];

    /**
     * Set an explicit root map path, overriding auto-discovery.
     * Pass null to revert to auto-discovery.
     */
    setExplicitRootMap(rootMapPath: string | null): void;

    /** Get the current explicit root map path (null if auto-discovering). */
    getExplicitRootMap(): string | null;

    /**
     * Resolve a key name to its definition.
     * Finds the root map, builds (or retrieves cached) key space, then looks up key.
     */
    resolveKey(keyName: string, contextFilePath: string): Promise<KeyDefinition | null>;

    /**
     * Resolve a key and return a detailed trace explaining which definition
     * was chosen and why, including every lookup step and any keyref chain followed.
     */
    explainKey(keyName: string, contextFilePath: string): Promise<KeyResolutionReport>;

    /**
     * Returns all keys from the key space for the given context file.
     * Used by completion to offer all available key names.
     */
    getAllKeys(contextFilePath: string): Promise<Map<string, KeyDefinition>>;

    /**
     * Get subject scheme map paths discovered during key space build.
     */
    getSubjectSchemePaths(contextFilePath: string): Promise<string[]>;

    /**
     * Get duplicate key definitions from the key space for the given context file.
     * Returns a map of key name to array of all definitions (effective + duplicates).
     */
    getDuplicateKeys(contextFilePath: string): Promise<Map<string, KeyDefinition[]>>;

    /**
     * Build key space from a root map. Uses cache + in-flight dedup.
     */
    buildKeySpace(rootMapPath: string): Promise<KeySpace>;

    /** Update workspace folders (on workspace change events). */
    updateWorkspaceFolders(added: string[], removed: string[]): void;

    /** Invalidate cache entries for a changed file. */
    invalidateForFile(changedFile: string): void;

    /** Reload cache configuration from settings. */
    reloadCacheConfig(): Promise<void>;

    /** Clean up timers and caches on shutdown. */
    shutdown(): void;
}

// ---------------------------------------------------------------------------
// ISubjectSchemeService
// ---------------------------------------------------------------------------

export interface ISubjectSchemeService {
    /**
     * Register subject scheme map paths discovered during key space build.
     * Clears merged cache so next lookup re-merges.
     */
    registerSchemes(schemePaths: string[]): void;

    /**
     * Look up valid values for an attribute on an element.
     * Falls back to wildcard '*' if no element-specific binding exists.
     */
    getValidValues(attributeName: string, elementName?: string): Set<string> | null;

    /**
     * Check if an attribute is controlled by a subject scheme.
     */
    isControlledAttribute(attributeName: string): boolean;

    /**
     * Get the hierarchy path for a subject key (e.g., "Platform > Linux > Ubuntu").
     */
    getHierarchyPath(key: string): string | null;

    /**
     * Get the default value for an attribute on an element.
     */
    getDefaultValue(attributeName: string, elementName?: string): string | null;

    /** Check if any scheme data is available. */
    hasSchemeData(): boolean;

    /** Invalidate a specific scheme file's cache. */
    invalidate(filePath: string): void;

    /** Clear all caches. */
    shutdown(): void;
}

// ---------------------------------------------------------------------------
// ICatalogValidationService
// ---------------------------------------------------------------------------

export interface ICatalogValidationService {
    /**
     * Initialize the service with the path to the extension root.
     *
     * @param extensionPath Path to the extension root directory.
     * @param externalCatalogPath Optional user-configured external catalog path.
     */
    initialize(extensionPath: string, externalCatalogPath?: string): void;

    /**
     * Re-initialize with a new external catalog path (on config change).
     */
    reinitialize(externalCatalogPath?: string): void;

    /** Whether TypesXML is loaded and ready. */
    readonly isAvailable: boolean;

    /** Error message if initialization failed. */
    readonly error: string | null;

    /**
     * Validate a DITA document against its DTD using TypesXML + catalog.
     * Returns LSP Diagnostic[] for DTD validation errors.
     */
    validate(text: string): Diagnostic[];
}
