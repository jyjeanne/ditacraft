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

// File watcher — invalidate key space cache on map changes
connection.onDidChangeWatchedFiles((params: DidChangeWatchedFilesParams) => {
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
connection.onDidChangeConfiguration((change: DidChangeConfigurationParams) => {
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

    return {
        kind: DocumentDiagnosticReportKind.Full,
        items: diagnostics,
    };
});

// Completion handler
connection.onCompletion((params: CompletionParams) => handleCompletion(params, documents));

// Hover handler
connection.onHover((params: HoverParams) => handleHover(params, documents));

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

// Document lifecycle events
documents.onDidOpen((event: TextDocumentChangeEvent<TextDocument>) => {
    connection.console.log(`Document opened: ${event.document.uri}`);
});

documents.onDidChangeContent((_change: TextDocumentChangeEvent<TextDocument>) => {
    connection.languages.diagnostics.refresh();
});

documents.onDidClose((event: TextDocumentChangeEvent<TextDocument>) => {
    clearDocumentSettings(event.document.uri);
    connection.console.log(`Document closed: ${event.document.uri}`);
});

// Wire up document manager and start listening
documents.listen(connection);
connection.listen();
