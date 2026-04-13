import {
    createConnection,
    TextDocuments,
    ProposedFeatures,
    InitializeParams,
    InitializeResult,
    DidChangeConfigurationNotification,
    DocumentDiagnosticReportKind,
    type DocumentDiagnosticReport,
    DocumentDiagnosticParams,
    CompletionParams,
    HoverParams,
    DocumentSymbolParams,
    WorkspaceSymbolParams,
    DefinitionParams,
    ReferenceParams,
    DocumentFormattingParams,
    DocumentRangeFormattingParams,
    CodeActionParams,
    PrepareRenameParams,
    RenameParams,
    FoldingRangeParams,
    DocumentLinkParams,
    DocumentLink,
    LinkedEditingRangeParams,
    Diagnostic,
    TextDocumentChangeEvent,
    DidChangeConfigurationParams,
    DidChangeWatchedFilesParams,
    WorkspaceFoldersChangeEvent,
    WorkspaceFolder,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import * as path from 'path';
import * as fs from 'fs';

import {
    initSettings,
    clearDocumentSettings,
    getDocumentSettings,
    updateGlobalSettings,
    DitaCraftSettings,
} from './settings';

import { handleCompletion } from './features/completion';
import { handleHover } from './features/hover';
import { handleDocumentSymbol, handleWorkspaceSymbol } from './features/symbols';
import { handleDefinition } from './features/definition';
import { handleReferences } from './features/references';
import { handleFormatting, handleRangeFormatting } from './features/formatting';
import { handleCodeActions } from './features/codeActions';
import { handlePrepareRename, handleRename } from './features/rename';
import { handleFoldingRanges } from './features/folding';
import { handleDocumentLinks, handleDocumentLinkResolve } from './features/documentLinks';
import { handleLinkedEditingRange } from './features/linkedEditing';
import { KeySpaceService } from './services/keySpaceService';
import { SubjectSchemeService } from './services/subjectSchemeService';
import { detectUnusedTopics, WorkspaceIndex } from './features/workspaceValidation';
import { collectDitaFilesAsync } from './utils/workspaceScanner';
import { CatalogValidationService } from './services/catalogValidationService';
import { RngValidationService } from './services/rngValidationService';
import { ValidationPipeline, ValidationSummary } from './services/validationPipeline';
import { setLocale } from './utils/i18n';
import { uriToPath } from './utils/textUtils';
import {
    detectClientCapabilities,
    extractWorkspaceFolderPaths,
    buildInitializeResult,
    isMapFile,
    classifyWatchedFileChanges,
} from './serverHandlers';

/** Response type for the ditacraft/validateFile custom request. */
interface ValidateFileResult {
    summary: ValidationSummary;
    diagnosticCount: number;
    /** Full diagnostics list — applied directly by the client for immediate getDiagnostics() visibility. */
    diagnostics: Diagnostic[];
}

// Create LSP connection using IPC transport
const connection = createConnection(ProposedFeatures.all);

// Create document manager for open text documents
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let keySpaceService: KeySpaceService | undefined;
const subjectSchemeService = new SubjectSchemeService();
const catalogValidationService = new CatalogValidationService();
const rngValidationService = new RngValidationService();
const validationPipeline = new ValidationPipeline(
    catalogValidationService, rngValidationService, subjectSchemeService,
    (msg) => connection.console.log(msg),
);

/** Incremental workspace index for cross-file duplicate detection. */
const workspaceIndex = new WorkspaceIndex();
/** Set of unused topic file paths (lowercase normalized). */
let unusedTopicPaths: Set<string> = new Set();

connection.onInitialize((params: InitializeParams): InitializeResult => {
    const clientCaps = detectClientCapabilities(params);
    hasConfigurationCapability = clientCaps.hasConfigurationCapability;
    hasWorkspaceFolderCapability = clientCaps.hasWorkspaceFolderCapability;

    // Set locale from client for localized diagnostic messages
    setLocale(params.locale);

    initSettings(connection, hasConfigurationCapability);

    // Create key space service for key resolution
    const workspaceFolders = extractWorkspaceFolderPaths(params);

    keySpaceService = new KeySpaceService(
        workspaceFolders,
        async () => {
            const settings = await getDocumentSettings('');
            return {
                keySpaceCacheTtlMinutes: settings.keySpaceCacheTtlMinutes,
                maxLinkMatches: settings.maxLinkMatches,
            };
        },
        (msg) => connection.console.log(msg)
    );

    // Initialize TypesXML catalog validation service.
    // The server module runs from <extensionPath>/server/out/server.js,
    // so extensionPath is two directories up from __dirname.
    const serverDir = __dirname; // server/out
    const extensionPath = path.resolve(serverDir, '..', '..');

    // Pass external catalog path from initialization options if available
    const initOptions = params.initializationOptions as { xmlCatalogPath?: string } | undefined;
    catalogValidationService.initialize(extensionPath, initOptions?.xmlCatalogPath || undefined);
    if (catalogValidationService.isAvailable) {
        connection.console.log('TypesXML catalog validation initialized (DITA 1.2/1.3/2.0)');
    } else if (catalogValidationService.error) {
        connection.console.log(`TypesXML not available: ${catalogValidationService.error}`);
    }

    // Initialize RNG validation service (optional — requires salve-annos + saxes)
    rngValidationService.initialize();
    if (rngValidationService.isAvailable) {
        connection.console.log('RNG validation service initialized (salve-annos)');
    } else if (rngValidationService.error) {
        connection.console.log(`RNG validation not available: ${rngValidationService.error}`);
    }

    const result = buildInitializeResult(hasWorkspaceFolderCapability);

    connection.console.log('DITA Language Server initialized');
    return result;
});

connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        connection.client.register(
            DidChangeConfigurationNotification.type,
            undefined
        );
    }

    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders((event: WorkspaceFoldersChangeEvent) => {
            connection.console.log('Workspace folder change event received');
            if (keySpaceService) {
                const added = event.added.map((f: WorkspaceFolder) => uriToPath(f.uri));
                const removed = event.removed.map((f: WorkspaceFolder) => uriToPath(f.uri));
                keySpaceService.updateWorkspaceFolders(added, removed);
            }
        });
    }

    connection.console.log('DITA Language Server ready');
});

// Workspace commands: setRootMap / clearRootMap
connection.onExecuteCommand(async (params) => {
    if (params.command === 'ditacraft.setRootMap') {
        const rootMapPath = params.arguments?.[0] as string | undefined;
        if (rootMapPath) {
            keySpaceService?.setExplicitRootMap(rootMapPath);
            connection.console.log(`Root map set to: ${rootMapPath}`);
            // Trigger revalidation of all open documents
            connection.languages.diagnostics.refresh();
        }
        return null;
    }

    if (params.command === 'ditacraft.clearRootMap') {
        keySpaceService?.setExplicitRootMap(null);
        connection.console.log('Root map cleared — reverting to auto-discovery');
        connection.languages.diagnostics.refresh();
        return null;
    }

    if (params.command === 'ditacraft.validateWorkspace') {
        const folders = keySpaceService?.getWorkspaceFolders() ?? [];
        if (folders.length === 0) {
            connection.console.log('No workspace folders to validate');
            return null;
        }

        connection.console.log('Starting workspace validation...');

        // Scan files once and share across both index builders
        const allDitaFiles = await collectDitaFilesAsync(folders);
        connection.console.log(`Found ${allDitaFiles.length} DITA files`);

        // Build workspace-level indices
        await workspaceIndex.buildFull(folders, allDitaFiles);
        connection.console.log(`Root ID index: ${workspaceIndex.rootIdIndex.size} unique IDs`);

        // Detect unused topics
        if (keySpaceService) {
            unusedTopicPaths = await detectUnusedTopics(folders, keySpaceService, allDitaFiles);
            connection.console.log(`Unused topics: ${unusedTopicPaths.size} orphaned files`);
        }

        // Trigger re-validation of all open documents (will now include workspace checks)
        connection.languages.diagnostics.refresh();
        connection.console.log('Workspace validation complete');
        return null;
    }

    return null;
});

// Custom request: ditacraft/validateFile
// Used by the manual validate command (Ctrl+Shift+V) to run the full pipeline
// and return a summary with the full diagnostics list. The client applies
// diagnostics directly from the response into a dedicated DiagnosticCollection,
// so getDiagnostics() returns results immediately without relying on push/pull.
connection.onRequest('ditacraft/validateFile', async (params: { uri: string }, token): Promise<ValidateFileResult> => {
    // Try the already-synced document; fall back to reading from disk when the
    // language client hasn't completed textDocument/didOpen yet (race condition).
    let document = documents.get(params.uri);
    if (!document) {
        try {
            const filePath = uriToPath(params.uri);
            const content = fs.readFileSync(filePath, 'utf-8');
            const ext = filePath.split('.').pop()?.toLowerCase() ?? 'dita';
            const langId = ext === 'ditamap' ? 'ditamap' : ext === 'bookmap' ? 'bookmap' : 'dita';
            document = TextDocument.create(params.uri, langId, 0, content);
        } catch {
            return { summary: { errors: 0, warnings: 0, infos: 0 }, diagnosticCount: 0, diagnostics: [] };
        }
    }

    const settings = await getDocumentSettings(document.uri);
    const diagnostics = await validationPipeline.validate(
        document, settings, keySpaceService,
        { rootIdIndex: workspaceIndex.rootIdIndex, unusedTopicPaths },
        token,
    );

    // Do NOT call connection.sendDiagnostics() or diagnostics.refresh() here.
    // The client applies diagnostics directly from the response into its own
    // 'ditacraft-manual' DiagnosticCollection for immediate getDiagnostics()
    // visibility. Pushing via sendDiagnostics would create a SECOND set in the
    // LSP collection, duplicating every entry in the Problems panel.
    // Auto-validation (on open/change) still uses the pull-diagnostics path.

    return {
        summary: ValidationPipeline.summarize(diagnostics),
        diagnosticCount: diagnostics.length,
        diagnostics,
    };
});

// File watcher — invalidate key space cache on map changes
connection.onDidChangeWatchedFiles(async (params: DidChangeWatchedFilesParams) => {
    const classification = classifyWatchedFileChanges(params);

    for (const change of classification.changes) {
        if (change.isMap) {
            keySpaceService?.invalidateForFile(change.fsPath);
            subjectSchemeService.invalidate(change.fsPath);
        }
    }
    // Incrementally update workspace index for changed .dita files
    if (classification.ditaFileChanged && workspaceIndex.initialized) {
        for (const change of classification.changes) {
            if (!change.fsPath.endsWith('.dita')) continue;
            if (change.type === 3 /* Deleted */) {
                workspaceIndex.removeFile(change.fsPath);
            } else {
                // Created (1) or Changed (2) — re-index
                await workspaceIndex.updateFile(change.fsPath);
            }
        }
        // Unused topics must be fully rebuilt when maps or topics change
        unusedTopicPaths = new Set();
    }
    // Invalidate save-dependent phases for changed files
    for (const change of classification.changes) {
        validationPipeline.invalidateForFileSave(change.uri);
    }
    // When external map files change, revalidate all open documents
    // (key space and cross-references may have changed)
    if (classification.mapChanged) {
        validationPipeline.invalidateForMapChange();
        debouncedRefresh('__map_external__', MAP_DEBOUNCE_MS);
    }
});

// Shutdown cleanup
connection.onShutdown(() => {
    validationPipeline.invalidateAll();
    keySpaceService?.shutdown();
    subjectSchemeService.shutdown();
});

// Configuration change handler
connection.onDidChangeConfiguration(async (change: DidChangeConfigurationParams) => {
    if (hasConfigurationCapability) {
        clearDocumentSettings();
    } else {
        updateGlobalSettings(
            (change.settings?.ditacraft || {}) as DitaCraftSettings
        );
    }
    keySpaceService?.reloadCacheConfig();

    // Re-initialize catalog service if xmlCatalogPath changed
    const settings = await getDocumentSettings('');
    if (settings.xmlCatalogPath !== undefined) {
        catalogValidationService.reinitialize(settings.xmlCatalogPath || undefined);
    }

    validationPipeline.invalidateAll();
    connection.languages.diagnostics.refresh();
});

// Pull-based diagnostics handler
connection.languages.diagnostics.on(async (params: DocumentDiagnosticParams, token): Promise<DocumentDiagnosticReport> => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return {
            kind: DocumentDiagnosticReportKind.Full,
            items: [],
        };
    }

    const settings = await getDocumentSettings(document.uri);
    const items = await validationPipeline.validate(
        document, settings, keySpaceService,
        { rootIdIndex: workspaceIndex.rootIdIndex, unusedTopicPaths },
        token,
    );

    return {
        kind: DocumentDiagnosticReportKind.Full,
        items,
    };
});

// Completion handler (async — supports key space resolution for keyref/conkeyref)
connection.onCompletion((params: CompletionParams) => handleCompletion(params, documents, keySpaceService, subjectSchemeService));

// Hover handler (async — supports key space resolution for keyref/conkeyref)
connection.onHover((params: HoverParams) => handleHover(params, documents, keySpaceService));

// Document symbols handler
connection.onDocumentSymbol((params: DocumentSymbolParams) => handleDocumentSymbol(params, documents));

// Workspace symbols handler (Ctrl+T search across files)
connection.onWorkspaceSymbol((params: WorkspaceSymbolParams) => {
    const folders = keySpaceService?.getWorkspaceFolders();
    return handleWorkspaceSymbol(params, documents, folders);
});

// Go to Definition handler
connection.onDefinition((params: DefinitionParams) => handleDefinition(params, documents, keySpaceService));

// Find References handler (cross-file via workspace folders)
connection.onReferences((params: ReferenceParams) => {
    const folders = keySpaceService?.getWorkspaceFolders();
    return handleReferences(params, documents, folders);
});

// Document formatting handler
connection.onDocumentFormatting((params: DocumentFormattingParams) => handleFormatting(params, documents));

// Range formatting handler
connection.onDocumentRangeFormatting((params: DocumentRangeFormattingParams) => handleRangeFormatting(params, documents));

// Code Actions handler
connection.onCodeAction((params: CodeActionParams) => handleCodeActions(params, documents));

// Prepare Rename handler
connection.onPrepareRename((params: PrepareRenameParams) => handlePrepareRename(params, documents));

// Rename handler (cross-file via workspace folders)
connection.onRenameRequest((params: RenameParams) => {
    const folders = keySpaceService?.getWorkspaceFolders();
    return handleRename(params, documents, folders);
});

// Folding Ranges handler
connection.onFoldingRanges((params: FoldingRangeParams) => handleFoldingRanges(params, documents));

// Document Links handler
connection.onDocumentLinks((params: DocumentLinkParams) => handleDocumentLinks(params, documents));

// Document Link Resolve handler
connection.onDocumentLinkResolve((link: DocumentLink) => handleDocumentLinkResolve(link, keySpaceService));

// Linked Editing Range handler (simultaneous open/close tag renaming)
connection.languages.onLinkedEditingRange((params: LinkedEditingRangeParams) => handleLinkedEditingRange(params, documents));

// --- Smart debouncing for diagnostics refresh ---
// Tiered delays: map files change less often but affect all documents;
// topic files change frequently and only affect themselves.
const TOPIC_DEBOUNCE_MS = 300;
const MAP_DEBOUNCE_MS = 1000;
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Debounced diagnostics refresh, keyed by document URI.
 * Cancels any pending refresh for the same key before scheduling a new one.
 */
function debouncedRefresh(key: string, delayMs: number): void {
    const existing = debounceTimers.get(key);
    if (existing) clearTimeout(existing);
    debounceTimers.set(key, setTimeout(() => {
        debounceTimers.delete(key);
        connection.languages.diagnostics.refresh();
    }, delayMs));
}

// Document lifecycle events
documents.onDidOpen((event: TextDocumentChangeEvent<TextDocument>) => {
    connection.console.log(`Document opened: ${event.document.uri}`);
});

documents.onDidChangeContent((change: TextDocumentChangeEvent<TextDocument>) => {
    const uri = change.document.uri;
    validationPipeline.invalidateForTextEdit(uri);
    if (isMapFile(uri)) {
        // Map changes affect key space for all documents — use longer delay
        keySpaceService?.invalidateForFile(uriToPath(uri));
        validationPipeline.invalidateForMapChange();
        debouncedRefresh(uri, MAP_DEBOUNCE_MS);
    } else {
        debouncedRefresh(uri, TOPIC_DEBOUNCE_MS);
    }
});

documents.onDidClose((event: TextDocumentChangeEvent<TextDocument>) => {
    const uri = event.document.uri;
    clearDocumentSettings(uri);
    validationPipeline.invalidateForDocument(uri);
    // Clean up any pending debounce timer for this document
    const timer = debounceTimers.get(uri);
    if (timer) {
        clearTimeout(timer);
        debounceTimers.delete(uri);
    }
    connection.console.log(`Document closed: ${uri}`);
});

// Wire up document manager and start listening
documents.listen(connection);
connection.listen();
