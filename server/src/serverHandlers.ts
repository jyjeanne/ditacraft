/**
 * Extracted, testable business logic from server.ts.
 *
 * These functions encapsulate the pure logic that was previously
 * inline in LSP connection handlers, making it independently testable.
 */
import {
    InitializeParams,
    InitializeResult,
    TextDocumentSyncKind,
    DidChangeWatchedFilesParams,
    FileChangeType,
} from 'vscode-languageserver/node';

import { URI } from 'vscode-uri';

// ── Initialization ──────────────────────────────────────────────

export interface ClientCapabilities {
    hasConfigurationCapability: boolean;
    hasWorkspaceFolderCapability: boolean;
}

/**
 * Detect client capabilities from initialization params.
 */
export function detectClientCapabilities(params: InitializeParams): ClientCapabilities {
    const caps = params.capabilities;
    return {
        hasConfigurationCapability: !!(caps.workspace && caps.workspace.configuration),
        hasWorkspaceFolderCapability: !!(caps.workspace && caps.workspace.workspaceFolders),
    };
}

/**
 * Extract workspace folder file-system paths from initialization params.
 */
export function extractWorkspaceFolderPaths(params: InitializeParams): string[] {
    return (params.workspaceFolders ?? [])
        .map(folder => URI.parse(folder.uri).fsPath);
}

/**
 * Build the InitializeResult with all server capabilities.
 */
export function buildInitializeResult(hasWorkspaceFolderCapability: boolean): InitializeResult {
    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            diagnosticProvider: {
                interFileDependencies: true,
                workspaceDiagnostics: false,
            },
            completionProvider: {
                resolveProvider: false,
                triggerCharacters: ['<', ' ', '"', '=', '/', '#'],
            },
            hoverProvider: true,
            documentSymbolProvider: true,
            workspaceSymbolProvider: true,
            definitionProvider: true,
            referencesProvider: true,
            documentFormattingProvider: true,
            documentRangeFormattingProvider: true,
            codeActionProvider: true,
            renameProvider: {
                prepareProvider: true,
            },
            foldingRangeProvider: true,
            documentLinkProvider: {
                resolveProvider: true,
            },
            linkedEditingRangeProvider: true,
            executeCommandProvider: {
                commands: [
                    'ditacraft.setRootMap',
                    'ditacraft.clearRootMap',
                    'ditacraft.validateWorkspace',
                ],
            },
        },
        serverInfo: {
            name: 'DitaCraft DITA Language Server',
            version: '0.7.2',
        },
    };

    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true,
            },
        };
    }

    return result;
}

// ── File utilities ──────────────────────────────────────────────

/** Check whether a URI refers to a DITA map file (.ditamap or .bookmap). */
export function isMapFile(uri: string): boolean {
    return uri.endsWith('.ditamap') || uri.endsWith('.bookmap');
}

// ── File watcher change classification ──────────────────────────

export interface ClassifiedFileChange {
    uri: string;
    fsPath: string;
    type: FileChangeType;
    isMap: boolean;
    isDita: boolean;
}

export interface FileChangeClassification {
    mapChanged: boolean;
    ditaFileChanged: boolean;
    changes: ClassifiedFileChange[];
}

/**
 * Classify file watcher changes into map/dita categories.
 * Pure function — no side effects.
 */
export function classifyWatchedFileChanges(params: DidChangeWatchedFilesParams): FileChangeClassification {
    let mapChanged = false;
    let ditaFileChanged = false;
    const changes: ClassifiedFileChange[] = [];

    for (const change of params.changes) {
        const fsPath = URI.parse(change.uri).fsPath;
        const isMap = fsPath.endsWith('.ditamap') || fsPath.endsWith('.bookmap');
        const isDita = fsPath.endsWith('.dita') || isMap;

        if (isMap) mapChanged = true;
        if (isDita) ditaFileChanged = true;

        changes.push({
            uri: change.uri,
            fsPath,
            type: change.type,
            isMap,
            isDita,
        });
    }

    return { mapChanged, ditaFileChanged, changes };
}
