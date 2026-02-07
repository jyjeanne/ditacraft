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
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

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
import { KeySpaceService } from './services/keySpaceService';
import { URI } from 'vscode-uri';

// Create LSP connection using IPC transport
const connection = createConnection(ProposedFeatures.all);

// Create document manager for open text documents
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let keySpaceService: KeySpaceService | undefined;

connection.onInitialize((params: InitializeParams): InitializeResult => {
    const capabilities = params.capabilities;

    hasConfigurationCapability = !!(
        capabilities.workspace && capabilities.workspace.configuration
    );
    hasWorkspaceFolderCapability = !!(
        capabilities.workspace && capabilities.workspace.workspaceFolders
    );

    initSettings(connection, hasConfigurationCapability);

    // Create key space service for key resolution
    const workspaceFolders = (params.workspaceFolders ?? [])
        .map(folder => URI.parse(folder.uri).fsPath);

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

    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            diagnosticProvider: {
                interFileDependencies: false,
                workspaceDiagnostics: false,
            },
            completionProvider: {
                resolveProvider: false,
                triggerCharacters: ['<', ' ', '"', '='],
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
        connection.workspace.onDidChangeWorkspaceFolders((event) => {
            connection.console.log('Workspace folder change event received');
            if (keySpaceService) {
                const added = event.added.map(f => URI.parse(f.uri).fsPath);
                const removed = event.removed.map(f => URI.parse(f.uri).fsPath);
                keySpaceService.updateWorkspaceFolders(added, removed);
            }
        });
    }

    connection.console.log('DITA Language Server ready');
});

// File watcher — invalidate key space cache on map changes
connection.onDidChangeWatchedFiles((params) => {
    for (const change of params.changes) {
        const filePath = URI.parse(change.uri).fsPath;
        if (filePath.endsWith('.ditamap') || filePath.endsWith('.bookmap')) {
            keySpaceService?.invalidateForFile(filePath);
        }
    }
});

// Shutdown cleanup
connection.onShutdown(() => {
    keySpaceService?.shutdown();
});

// Configuration change handler
connection.onDidChangeConfiguration((change) => {
    if (hasConfigurationCapability) {
        clearDocumentSettings();
    } else {
        updateGlobalSettings(
            (change.settings?.ditacraft || {}) as DitaCraftSettings
        );
    }
    keySpaceService?.reloadCacheConfig();
    connection.languages.diagnostics.refresh();
});

// Pull-based diagnostics handler
connection.languages.diagnostics.on(async (params): Promise<DocumentDiagnosticReport> => {
    const document = documents.get(params.textDocument.uri);
    if (!document) {
        return {
            kind: DocumentDiagnosticReportKind.Full,
            items: [],
        };
    }

    const settings = await getDocumentSettings(document.uri);
    const diagnostics = validateDITADocument(document, settings);

    return {
        kind: DocumentDiagnosticReportKind.Full,
        items: diagnostics,
    };
});

// Completion handler
connection.onCompletion((params) => handleCompletion(params, documents));

// Hover handler
connection.onHover((params) => handleHover(params, documents));

// Document symbols handler
connection.onDocumentSymbol((params) => handleDocumentSymbol(params, documents));

// Workspace symbols handler (Ctrl+T search across files)
connection.onWorkspaceSymbol((params) => {
    const folders = keySpaceService?.getWorkspaceFolders();
    return handleWorkspaceSymbol(params, documents, folders);
});

// Go to Definition handler
connection.onDefinition((params) => handleDefinition(params, documents, keySpaceService));

// Find References handler (cross-file via workspace folders)
connection.onReferences((params) => {
    const folders = keySpaceService?.getWorkspaceFolders();
    return handleReferences(params, documents, folders);
});

// Document formatting handler
connection.onDocumentFormatting((params) => handleFormatting(params, documents));

// Range formatting handler
connection.onDocumentRangeFormatting((params) => handleRangeFormatting(params, documents));

// Code Actions handler
connection.onCodeAction((params) => handleCodeActions(params, documents));

// Prepare Rename handler
connection.onPrepareRename((params) => handlePrepareRename(params, documents));

// Rename handler (cross-file via workspace folders)
connection.onRenameRequest((params) => {
    const folders = keySpaceService?.getWorkspaceFolders();
    return handleRename(params, documents, folders);
});

// Folding Ranges handler
connection.onFoldingRanges((params) => handleFoldingRanges(params, documents));

// Document Links handler
connection.onDocumentLinks((params) => handleDocumentLinks(params, documents));

// Document Link Resolve handler
connection.onDocumentLinkResolve((link) => handleDocumentLinkResolve(link, keySpaceService));

// Linked Editing Range handler (simultaneous open/close tag renaming)
connection.languages.onLinkedEditingRange((params) => handleLinkedEditingRange(params, documents));

// Document lifecycle events
documents.onDidOpen((event) => {
    connection.console.log(`Document opened: ${event.document.uri}`);
});

documents.onDidChangeContent((_change) => {
    connection.languages.diagnostics.refresh();
});

documents.onDidClose((event) => {
    clearDocumentSettings(event.document.uri);
    connection.console.log(`Document closed: ${event.document.uri}`);
});

// Wire up document manager and start listening
documents.listen(connection);
connection.listen();
