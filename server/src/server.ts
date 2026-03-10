import {
    createConnection,
    TextDocuments,
    ProposedFeatures,
    InitializeParams,
    InitializeResult,
    TextDocumentSyncKind,
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
    TextDocumentChangeEvent,
    DidChangeConfigurationParams,
    DidChangeWatchedFilesParams,
    WorkspaceFoldersChangeEvent,
    WorkspaceFolder,
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';
import * as path from 'path';

import {
    initSettings,
    clearDocumentSettings,
    getDocumentSettings,
    updateGlobalSettings,
    DitaCraftSettings,
} from './settings';

import { validateDITADocument } from './features/validation';
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
import { validateCrossReferences } from './features/crossRefValidation';
import { validateDitaRules } from './features/ditaRulesValidator';
import { KeySpaceService } from './services/keySpaceService';
import { SubjectSchemeService } from './services/subjectSchemeService';
import { validateProfilingAttributes } from './features/profilingValidation';
import { detectCircularReferences } from './features/circularRefDetection';
import { buildRootIdIndex, detectCrossFileDuplicateIds, detectUnusedTopics, createUnusedTopicDiagnostic } from './features/workspaceValidation';
import { detectDitaVersion } from './utils/ditaVersionDetector';
import { CatalogValidationService } from './services/catalogValidationService';
import { RngValidationService } from './services/rngValidationService';
import { URI } from 'vscode-uri';
import { setLocale } from './utils/i18n';

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

/** Workspace-level root ID index for cross-file duplicate detection. */
let rootIdIndex: Map<string, string[]> = new Map();
/** Set of unused topic file paths (lowercase normalized). */
let unusedTopicPaths: Set<string> = new Set();

connection.onInitialize((params: InitializeParams): InitializeResult => {
    const capabilities = params.capabilities;

    hasConfigurationCapability = !!(
        capabilities.workspace && capabilities.workspace.configuration
    );
    hasWorkspaceFolderCapability = !!(
        capabilities.workspace && capabilities.workspace.workspaceFolders
    );

    // Set locale from client for localized diagnostic messages
    setLocale(params.locale);

    initSettings(connection, hasConfigurationCapability);

    // Create key space service for key resolution
    const workspaceFolders = (params.workspaceFolders ?? [])
        .map((folder: WorkspaceFolder) => URI.parse(folder.uri).fsPath);

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

    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            diagnosticProvider: {
                interFileDependencies: false,
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
                commands: ['ditacraft.setRootMap', 'ditacraft.clearRootMap', 'ditacraft.validateWorkspace'],
            },
        },
    };

    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true,
            },
        };
    }

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
                const added = event.added.map((f: WorkspaceFolder) => URI.parse(f.uri).fsPath);
                const removed = event.removed.map((f: WorkspaceFolder) => URI.parse(f.uri).fsPath);
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

        // Build workspace-level indices
        rootIdIndex = buildRootIdIndex(folders);
        connection.console.log(`Root ID index: ${rootIdIndex.size} unique IDs`);

        // Detect unused topics
        if (keySpaceService) {
            unusedTopicPaths = await detectUnusedTopics(folders, keySpaceService);
            connection.console.log(`Unused topics: ${unusedTopicPaths.size} orphaned files`);
        }

        // Trigger re-validation of all open documents (will now include workspace checks)
        connection.languages.diagnostics.refresh();
        connection.console.log('Workspace validation complete');
        return null;
    }

    return null;
});

// File watcher — invalidate key space cache on map changes
connection.onDidChangeWatchedFiles((params: DidChangeWatchedFilesParams) => {
    let mapChanged = false;
    let ditaFileChanged = false;
    for (const change of params.changes) {
        const filePath = URI.parse(change.uri).fsPath;
        if (filePath.endsWith('.ditamap') || filePath.endsWith('.bookmap')) {
            keySpaceService?.invalidateForFile(filePath);
            subjectSchemeService.invalidate(filePath);
            mapChanged = true;
        }
        if (filePath.endsWith('.dita') || filePath.endsWith('.ditamap') || filePath.endsWith('.bookmap')) {
            ditaFileChanged = true;
        }
    }
    // Clear stale workspace validation indices when DITA files change
    if (ditaFileChanged && (rootIdIndex.size > 0 || unusedTopicPaths.size > 0)) {
        rootIdIndex = new Map();
        unusedTopicPaths = new Set();
    }
    // When external map files change, revalidate all open documents
    // (key space and cross-references may have changed)
    if (mapChanged) {
        debouncedRefresh('__map_external__', MAP_DEBOUNCE_MS);
    }
});

// Shutdown cleanup
connection.onShutdown(() => {
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

    connection.languages.diagnostics.refresh();
});

// Pull-based diagnostics handler
connection.languages.diagnostics.on(async (params: DocumentDiagnosticParams): Promise<DocumentDiagnosticReport> => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return {
            kind: DocumentDiagnosticReportKind.Full,
            items: [],
        };
    }

    const settings = await getDocumentSettings(document.uri);
    const diagnostics = validateDITADocument(document, settings);

    const text = document.getText();

    // Schema validation: DTD (TypesXML) or RNG (salve-annos) — mutually exclusive.
    // When schemaFormat is 'rng' and available, skip DTD validation to avoid duplicates.
    const useRng = rngValidationService.isAvailable && settings.schemaFormat === 'rng';

    // DTD validation via TypesXML + OASIS catalog (when available).
    // Only run when typesxml engine is selected AND RNG is not active.
    if (!useRng && catalogValidationService.isAvailable && settings.validationEngine === 'typesxml') {
        const existingErrorLines = new Set(
            diagnostics
                .filter(d => d.code === 'DITA-XML-001')
                .map(d => d.range.start.line)
        );
        const dtdDiags = catalogValidationService.validate(text);
        for (const diag of dtdDiags) {
            if (!existingErrorLines.has(diag.range.start.line)) {
                diagnostics.push(diag);
            }
        }
    }

    // RNG validation via salve-annos (when available and selected)
    if (useRng) {
        if (settings.rngSchemaPath) {
            rngValidationService.setSchemaBasePath(settings.rngSchemaPath);
        }
        const rngDiags = await rngValidationService.validate(text);
        diagnostics.push(...rngDiags);
    }

    // Cross-reference validation (async — needs file system + key space)
    if (settings.crossRefValidationEnabled !== false) {
        const xrefDiags = await validateCrossReferences(
            text, document.uri,
            keySpaceService, settings.maxNumberOfProblems
        );
        diagnostics.push(...xrefDiags);
    }

    // Register subject scheme maps discovered during key space build
    if (keySpaceService) {
        const filePath = URI.parse(document.uri).fsPath;
        const schemePaths = await keySpaceService.getSubjectSchemePaths(filePath);
        subjectSchemeService.registerSchemes(schemePaths);
    }

    // Profiling attribute validation (subject scheme constraints)
    if (settings.subjectSchemeValidationEnabled !== false) {
        const profilingDiags = validateProfilingAttributes(
            text, subjectSchemeService, settings.maxNumberOfProblems
        );
        diagnostics.push(...profilingDiags);
    }

    // Schematron-equivalent DITA rules (auto-detect DITA version, with override)
    const ditaVersion = settings.ditaVersion && settings.ditaVersion !== 'auto'
        ? settings.ditaVersion
        : detectDitaVersion(text);
    const ruleDiags = validateDitaRules(text, {
        enabled: settings.ditaRulesEnabled !== false,
        categories: settings.ditaRulesCategories ?? ['mandatory', 'recommendation', 'authoring', 'accessibility'],
        ditaVersion,
    });
    diagnostics.push(...ruleDiags);

    // Circular reference detection (async — follows file references)
    if (settings.crossRefValidationEnabled !== false) {
        const cycleDiags = await detectCircularReferences(text, document.uri);
        diagnostics.push(...cycleDiags);
    }

    // Workspace-level checks (only if workspace validation has been run)
    const filePath = URI.parse(document.uri).fsPath;

    // Cross-file duplicate root ID detection
    if (rootIdIndex.size > 0) {
        const dupIdDiags = detectCrossFileDuplicateIds(text, filePath, rootIdIndex);
        diagnostics.push(...dupIdDiags);
    }

    // Unused topic detection
    if (unusedTopicPaths.size > 0) {
        const normalizedPath = path.resolve(filePath).toLowerCase();
        if (unusedTopicPaths.has(normalizedPath)) {
            diagnostics.push(createUnusedTopicDiagnostic());
        }
    }

    // Cap total diagnostics
    const maxProblems = settings.maxNumberOfProblems ?? 100;
    const items = diagnostics.length > maxProblems
        ? diagnostics.slice(0, maxProblems)
        : diagnostics;

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

function isMapFile(uri: string): boolean {
    return uri.endsWith('.ditamap') || uri.endsWith('.bookmap');
}

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
    if (isMapFile(uri)) {
        // Map changes affect key space for all documents — use longer delay
        keySpaceService?.invalidateForFile(URI.parse(uri).fsPath);
        debouncedRefresh(uri, MAP_DEBOUNCE_MS);
    } else {
        debouncedRefresh(uri, TOPIC_DEBOUNCE_MS);
    }
});

documents.onDidClose((event: TextDocumentChangeEvent<TextDocument>) => {
    const uri = event.document.uri;
    clearDocumentSettings(uri);
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
