# DITA Language Server Protocol (LSP) — Complete Specification

**Version:** 3.0.0  
**Author:** Jeremy Jeanne  
**Date:** February 2026  
**References:**
- [VS Code Language Server Extension Guide](https://code.visualstudio.com/api/language-extensions/language-server-extension-guide)
- [Microsoft LSP Sample](https://github.com/microsoft/vscode-extension-samples/tree/main/lsp-sample)
- [Language Server Protocol Specification](https://microsoft.github.io/language-server-protocol/)

---

## 1. Introduction

### 1.1 Why a Language Server for DITA?

Language Server is a special kind of Visual Studio Code extension that powers the editing experience for many programming languages. With Language Servers, you can implement:

- **Autocomplete** — Context-aware element and attribute suggestions
- **Diagnostics** — Real-time validation and error checking
- **Go to Definition** — Navigate to conref/keyref targets
- **Find References** — Locate all usages of an element or key
- **Hover Information** — Documentation tooltips for elements
- **Document Symbols** — Outline view for topic structure
- **Formatting** — Consistent XML formatting
- **Code Actions** — Quick fixes for common issues

### 1.2 Benefits of the LSP Architecture

The Language Server Protocol solves three common problems:

1. **Language Independence**: The server can be implemented in any language. For DITA, we use TypeScript/Node.js, but the same protocol could power servers written in Java, Python, or any language with XML parsing capabilities.

2. **Performance Isolation**: Language features can be resource intensive. Validating DITA files requires parsing XML, resolving references, and checking against schemas. Running this in a separate process ensures VS Code's UI remains responsive.

3. **Editor Independence**: The same DITA Language Server can work with any LSP-compliant editor (VS Code, Neovim, Eclipse, Sublime Text, etc.).

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   VS Code       │     │    Neovim       │     │    Eclipse      │
│   (Client)      │     │    (Client)     │     │    (Client)     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                          Language Server
                            Protocol
                                 │
                    ┌────────────┴────────────┐
                    │   DITA Language Server  │
                    │   (Single Implementation)│
                    └─────────────────────────┘
```

### 1.3 Architecture Overview

A VS Code language server extension has two parts:

- **Language Client**: A normal VS Code extension written in TypeScript. Has access to all VS Code Namespace API.
- **Language Server**: A language analysis tool running in a separate process. Communicates via JSON-RPC.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        VS Code Extension Host                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Language Client                             │  │
│  │                    (client/src/extension.ts)                   │  │
│  │  • Starts the Language Server                                  │  │
│  │  • Forwards document events to server                          │  │
│  │  • Receives diagnostics, completions from server               │  │
│  │  • Has access to VS Code API (commands, UI, etc.)              │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ JSON-RPC over IPC (Node's IPC)
                                 │ Incremental text sync
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Language Server Process                           │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    DITA Language Server                        │  │
│  │                    (server/src/server.ts)                      │  │
│  │  • Receives document open/change/close events                  │  │
│  │  • Validates DITA content                                      │  │
│  │  • Provides completions, hover, definitions                    │  │
│  │  • Manages key space from maps                                 │  │
│  │  • Resolves conrefs and keyrefs                                │  │
│  │  • NO access to VS Code API                                    │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Project Structure

```
dita-lsp/
├── .vscode/
│   ├── launch.json                 # Debug configurations
│   ├── settings.json               # Workspace settings  
│   └── tasks.json                  # Build tasks
│
├── client/                         # Language Client
│   ├── src/
│   │   ├── extension.ts            # Client entry point
│   │   └── test/                   # End-to-End tests
│   │       ├── helper.ts           # Test utilities
│   │       ├── index.ts            # Test runner
│   │       ├── diagnostics.test.ts # Diagnostic tests
│   │       └── completion.test.ts  # Completion tests
│   ├── package.json                # Client dependencies
│   └── tsconfig.json               # Client TypeScript config
│
├── server/                         # Language Server
│   ├── src/
│   │   ├── server.ts               # Server entry point
│   │   ├── capabilities.ts         # Server capabilities
│   │   ├── settings.ts             # Settings management
│   │   ├── features/               # Language features
│   │   │   ├── validation.ts       # Diagnostics
│   │   │   ├── completion.ts       # Auto-complete
│   │   │   ├── hover.ts            # Hover information
│   │   │   ├── definition.ts       # Go to definition
│   │   │   ├── references.ts       # Find references
│   │   │   ├── symbols.ts          # Document symbols
│   │   │   ├── formatting.ts       # Document formatting
│   │   │   ├── codeActions.ts      # Quick fixes
│   │   │   ├── documentLinks.ts    # Clickable links
│   │   │   ├── folding.ts          # Folding ranges
│   │   │   ├── rename.ts           # Rename symbol
│   │   │   └── signatureHelp.ts    # Signature help
│   │   ├── parser/                 # DITA/XML parsing
│   │   │   ├── xmlParser.ts        # Error-tolerant XML parser
│   │   │   ├── ditaDocument.ts     # DITA document model
│   │   │   └── ditaTypes.ts        # DITA type definitions
│   │   ├── services/               # Core services
│   │   │   ├── keySpace.ts         # Key management
│   │   │   ├── conrefResolver.ts   # Conref resolution
│   │   │   ├── schemaService.ts    # Schema validation
│   │   │   ├── workspaceService.ts # Workspace indexing
│   │   │   └── ditavalService.ts   # DITAVAL filtering
│   │   └── utils/                  # Utilities
│   │       ├── uri.ts              # URI handling
│   │       └── positions.ts        # Position calculations
│   ├── package.json                # Server dependencies
│   └── tsconfig.json               # Server TypeScript config
│
├── syntaxes/                       # TextMate grammars
│   ├── dita.tmLanguage.json        # DITA syntax highlighting
│   └── ditaval.tmLanguage.json     # DITAVAL syntax highlighting
│
├── testFixture/                    # Test files for E2E tests
│   ├── topics/
│   │   ├── concept.dita
│   │   ├── task.dita
│   │   └── with-errors.dita
│   ├── maps/
│   │   └── bookmap.ditamap
│   └── completion.dita
│
├── package.json                    # Extension manifest (root)
├── tsconfig.json                   # Root TypeScript config
├── language-configuration.json     # Bracket matching, comments
└── README.md
```

---

## 3. Extension Manifest (package.json)

The root `package.json` describes the extension capabilities:

```json
{
  "name": "dita-lsp",
  "displayName": "DITA Language Support",
  "description": "Intelligent DITA XML editing with validation, completion, and navigation",
  "version": "1.0.0",
  "publisher": "jyjeanne",
  "author": "Jeremy Jeanne",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/jyjeanne/dita-lsp"
  },
  "bugs": {
    "url": "https://github.com/jyjeanne/dita-lsp/issues"
  },
  "icon": "images/dita-icon.png",
  "categories": [
    "Programming Languages",
    "Linters",
    "Formatters",
    "Snippets"
  ],
  "keywords": [
    "dita",
    "xml",
    "technical writing",
    "documentation",
    "dita-ot",
    "multi-root ready"
  ],
  "engines": {
    "vscode": "^1.75.0"
  },
  "activationEvents": [],
  "main": "./client/out/extension",
  "contributes": {
    "languages": [
      {
        "id": "dita",
        "aliases": ["DITA", "dita"],
        "extensions": [".dita"],
        "configuration": "./language-configuration.json",
        "icon": {
          "light": "./images/dita-file-light.svg",
          "dark": "./images/dita-file-dark.svg"
        }
      },
      {
        "id": "ditamap",
        "aliases": ["DITA Map", "ditamap"],
        "extensions": [".ditamap"],
        "configuration": "./language-configuration.json"
      },
      {
        "id": "ditaval",
        "aliases": ["DITAVAL", "ditaval"],
        "extensions": [".ditaval"],
        "configuration": "./language-configuration.json"
      }
    ],
    "grammars": [
      {
        "language": "dita",
        "scopeName": "text.xml.dita",
        "path": "./syntaxes/dita.tmLanguage.json"
      },
      {
        "language": "ditamap",
        "scopeName": "text.xml.dita",
        "path": "./syntaxes/dita.tmLanguage.json"
      },
      {
        "language": "ditaval",
        "scopeName": "text.xml.ditaval",
        "path": "./syntaxes/ditaval.tmLanguage.json"
      }
    ],
    "configuration": {
      "type": "object",
      "title": "DITA Language Server",
      "properties": {
        "ditaLanguageServer.maxNumberOfProblems": {
          "scope": "resource",
          "type": "number",
          "default": 100,
          "description": "Controls the maximum number of problems produced by the server."
        },
        "ditaLanguageServer.trace.server": {
          "scope": "window",
          "type": "string",
          "enum": ["off", "messages", "verbose"],
          "default": "off",
          "description": "Traces the communication between VS Code and the DITA language server."
        },
        "ditaLanguageServer.dita.version": {
          "scope": "resource",
          "type": "string",
          "enum": ["auto", "1.3", "2.0"],
          "default": "auto",
          "description": "DITA version for validation and completion. 'auto' detects from DOCTYPE."
        },
        "ditaLanguageServer.validation.enabled": {
          "scope": "resource",
          "type": "boolean",
          "default": true,
          "description": "Enable/disable all validation."
        },
        "ditaLanguageServer.validation.schema": {
          "scope": "resource",
          "type": "boolean",
          "default": true,
          "description": "Enable schema-based validation."
        },
        "ditaLanguageServer.validation.references": {
          "scope": "resource",
          "type": "boolean",
          "default": true,
          "description": "Validate conref, keyref, and href references."
        },
        "ditaLanguageServer.validation.ids": {
          "scope": "resource",
          "type": "boolean",
          "default": true,
          "description": "Check for duplicate and invalid IDs."
        },
        "ditaLanguageServer.keys.rootMap": {
          "scope": "resource",
          "type": "string",
          "default": "",
          "description": "Path to root map for key resolution (relative to workspace root)."
        },
        "ditaLanguageServer.keys.autoDetect": {
          "scope": "resource",
          "type": "boolean",
          "default": true,
          "description": "Automatically detect root map from workspace."
        },
        "ditaLanguageServer.ditaval.activeFile": {
          "scope": "resource",
          "type": "string",
          "default": "",
          "description": "Active DITAVAL file for conditional filtering preview."
        },
        "ditaLanguageServer.completion.snippets": {
          "scope": "resource",
          "type": "boolean",
          "default": true,
          "description": "Enable snippet completions for complex elements."
        },
        "ditaLanguageServer.formatting.enabled": {
          "scope": "resource",
          "type": "boolean",
          "default": true,
          "description": "Enable document formatting."
        },
        "ditaLanguageServer.formatting.indentSize": {
          "scope": "resource",
          "type": "number",
          "default": 2,
          "description": "Number of spaces for indentation."
        }
      }
    },
    "configurationDefaults": {
      "[dita]": {
        "editor.wordWrap": "on",
        "editor.autoClosingBrackets": "always",
        "editor.suggest.insertMode": "replace"
      },
      "[ditamap]": {
        "editor.wordWrap": "on"
      }
    },
    "commands": [
      {
        "command": "ditaLanguageServer.restart",
        "title": "Restart DITA Language Server",
        "category": "DITA"
      },
      {
        "command": "ditaLanguageServer.setRootMap",
        "title": "Set Root Map",
        "category": "DITA"
      },
      {
        "command": "ditaLanguageServer.showKeySpace",
        "title": "Show Key Space",
        "category": "DITA"
      },
      {
        "command": "ditaLanguageServer.validateWorkspace",
        "title": "Validate All DITA Files",
        "category": "DITA"
      }
    ],
    "menus": {
      "commandPalette": [
        {
          "command": "ditaLanguageServer.restart",
          "when": "editorLangId =~ /^dita/"
        },
        {
          "command": "ditaLanguageServer.setRootMap",
          "when": "editorLangId =~ /^dita/"
        }
      ],
      "editor/context": [
        {
          "command": "ditaLanguageServer.showKeySpace",
          "when": "editorLangId == ditamap",
          "group": "navigation"
        }
      ]
    }
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -b",
    "watch": "tsc -b -w",
    "lint": "eslint ./client/src ./server/src --ext .ts",
    "postinstall": "cd client && npm install && cd ../server && npm install",
    "test": "sh ./scripts/e2e.sh",
    "test:unit": "cd server && npm test"
  },
  "devDependencies": {
    "@types/mocha": "^10.0.6",
    "@types/node": "^20.11.0",
    "@typescript-eslint/eslint-plugin": "^7.1.0",
    "@typescript-eslint/parser": "^7.1.0",
    "eslint": "^8.57.0",
    "typescript": "^5.4.0"
  }
}
```

---

## 4. Language Client

### 4.1 Client Dependencies (client/package.json)

```json
{
  "name": "dita-lsp-client",
  "description": "DITA Language Client",
  "version": "1.0.0",
  "engines": {
    "vscode": "^1.75.0"
  },
  "main": "./out/extension.js",
  "dependencies": {
    "vscode-languageclient": "^9.0.1"
  },
  "devDependencies": {
    "@types/vscode": "^1.75.0",
    "@vscode/test-electron": "^2.3.9",
    "@types/mocha": "^10.0.6",
    "mocha": "^10.3.0"
  },
  "scripts": {
    "compile": "tsc -b",
    "watch": "tsc -b -w",
    "test": "node ./out/test/runTest.js"
  }
}
```

### 4.2 Client Implementation (client/src/extension.ts)

```typescript
/* --------------------------------------------------------------------------------------------
 * DITA Language Client
 * 
 * This extension starts the DITA Language Server and acts as a bridge between
 * VS Code and the server. It handles:
 * - Starting/stopping the server
 * - Forwarding document events
 * - Registering commands
 * - Synchronizing configuration
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { 
  workspace, 
  ExtensionContext, 
  commands,
  window,
  StatusBarAlignment,
  StatusBarItem
} from 'vscode';

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
  State
} from 'vscode-languageclient/node';

let client: LanguageClient;
let statusBarItem: StatusBarItem;

export function activate(context: ExtensionContext) {
  // Create status bar item
  statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(loading~spin) DITA';
  statusBarItem.tooltip = 'DITA Language Server starting...';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // The server is implemented in node
  const serverModule = context.asAbsolutePath(
    path.join('server', 'out', 'server.js')
  );

  // Debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode
  // so VS Code can attach to the server for debugging
  const debugOptions = { execArgv: ['--nolazy', '--inspect=6009'] };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { 
      module: serverModule, 
      transport: TransportKind.ipc 
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions
    }
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for DITA documents
    documentSelector: [
      { scheme: 'file', language: 'dita' },
      { scheme: 'file', language: 'ditamap' },
      { scheme: 'file', language: 'ditaval' },
      { scheme: 'untitled', language: 'dita' },
      { scheme: 'untitled', language: 'ditamap' }
    ],
    synchronize: {
      // Notify the server about file changes to relevant files in the workspace
      fileEvents: [
        workspace.createFileSystemWatcher('**/*.dita'),
        workspace.createFileSystemWatcher('**/*.ditamap'),
        workspace.createFileSystemWatcher('**/*.ditaval')
      ]
    },
    // Middleware can intercept requests/responses
    middleware: {
      // Example: Transform completions before showing
      provideCompletionItem: async (document, position, context, token, next) => {
        const result = await next(document, position, context, token);
        // Could filter or modify completions here
        return result;
      }
    },
    // Output channel for server logs
    outputChannel: window.createOutputChannel('DITA Language Server'),
    // Trace output channel (for LSP message tracing)
    traceOutputChannel: window.createOutputChannel('DITA LSP Trace')
  };

  // Create the language client and start the client
  client = new LanguageClient(
    'ditaLanguageServer',
    'DITA Language Server',
    serverOptions,
    clientOptions
  );

  // Update status bar based on client state
  client.onDidChangeState((event) => {
    switch (event.newState) {
      case State.Starting:
        statusBarItem.text = '$(loading~spin) DITA';
        statusBarItem.tooltip = 'DITA Language Server starting...';
        break;
      case State.Running:
        statusBarItem.text = '$(check) DITA';
        statusBarItem.tooltip = 'DITA Language Server running';
        break;
      case State.Stopped:
        statusBarItem.text = '$(error) DITA';
        statusBarItem.tooltip = 'DITA Language Server stopped';
        break;
    }
  });

  // Register commands
  context.subscriptions.push(
    commands.registerCommand('ditaLanguageServer.restart', async () => {
      await client.stop();
      await client.start();
      window.showInformationMessage('DITA Language Server restarted');
    })
  );

  context.subscriptions.push(
    commands.registerCommand('ditaLanguageServer.setRootMap', async () => {
      const maps = await workspace.findFiles('**/*.ditamap', '**/node_modules/**');
      if (maps.length === 0) {
        window.showWarningMessage('No DITA maps found in workspace');
        return;
      }

      const items = maps.map(uri => ({
        label: workspace.asRelativePath(uri),
        uri: uri.fsPath
      }));

      const selected = await window.showQuickPick(items, {
        placeHolder: 'Select root map for key resolution'
      });

      if (selected) {
        const config = workspace.getConfiguration('ditaLanguageServer');
        await config.update('keys.rootMap', selected.label, false);
        window.showInformationMessage(`Root map set to: ${selected.label}`);
      }
    })
  );

  context.subscriptions.push(
    commands.registerCommand('ditaLanguageServer.showKeySpace', async () => {
      // Request key space from server
      const result = await client.sendRequest('dita/getKeySpace');
      // Show in a quick pick or webview
      window.showInformationMessage(`Key space contains ${(result as any).keyCount} keys`);
    })
  );

  // Start the client. This will also launch the server
  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
```

---

## 5. Language Server

### 5.1 Server Dependencies (server/package.json)

```json
{
  "name": "dita-lsp-server",
  "description": "DITA Language Server",
  "version": "1.0.0",
  "main": "./out/server.js",
  "dependencies": {
    "vscode-languageserver": "^9.0.1",
    "vscode-languageserver-textdocument": "^1.0.11",
    "vscode-uri": "^3.0.8",
    "sax": "^1.4.1",
    "fast-glob": "^3.3.2",
    "lru-cache": "^10.2.0"
  },
  "devDependencies": {
    "@types/sax": "^1.2.7",
    "@types/node": "^20.11.0",
    "typescript": "^5.4.0",
    "vitest": "^1.3.0"
  },
  "scripts": {
    "compile": "tsc -b",
    "watch": "tsc -b -w",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

### 5.2 Server Implementation (server/src/server.ts)

```typescript
/* --------------------------------------------------------------------------------------------
 * DITA Language Server
 * 
 * Main entry point for the language server. Handles:
 * - Connection setup
 * - Capability registration
 * - Document synchronization
 * - Request routing to feature handlers
 * ------------------------------------------------------------------------------------------ */

import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  InitializeResult,
  DidChangeConfigurationNotification,
  TextDocumentSyncKind,
  DocumentDiagnosticReportKind,
  type DocumentDiagnosticReport,
  CompletionItem,
  TextDocumentPositionParams,
  Hover,
  Definition,
  Location,
  DocumentSymbol,
  CodeAction,
  CodeActionKind,
  DocumentLink,
  FoldingRange,
  TextEdit,
  Range,
  WorkspaceEdit
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

// Feature imports
import { validateDITADocument } from './features/validation';
import { provideCompletions, resolveCompletion } from './features/completion';
import { provideHover } from './features/hover';
import { provideDefinition } from './features/definition';
import { provideReferences } from './features/references';
import { provideDocumentSymbols, provideWorkspaceSymbols } from './features/symbols';
import { provideFormatting, provideRangeFormatting } from './features/formatting';
import { provideCodeActions } from './features/codeActions';
import { provideDocumentLinks, resolveDocumentLink } from './features/documentLinks';
import { provideFoldingRanges } from './features/folding';
import { prepareRename, provideRenameEdits } from './features/rename';

// Service imports
import { KeySpaceService } from './services/keySpace';
import { WorkspaceService } from './services/workspaceService';
import { DITASettings, defaultSettings, getDocumentSettings, clearDocumentSettings } from './settings';

// ============================================================================
// Connection Setup
// ============================================================================

// Create a connection for the server using Node's IPC as transport
// ProposedFeatures.all enables all LSP preview/proposed features
const connection = createConnection(ProposedFeatures.all);

// Create a text document manager that supports incremental sync
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// Services
let keySpaceService: KeySpaceService;
let workspaceService: WorkspaceService;

// Capability flags
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

// ============================================================================
// Initialization
// ============================================================================

connection.onInitialize((params: InitializeParams): InitializeResult => {
  const capabilities = params.capabilities;

  // Check client capabilities
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  // Initialize services
  workspaceService = new WorkspaceService(
    params.workspaceFolders || [],
    connection
  );
  keySpaceService = new KeySpaceService(workspaceService, connection);

  // Return server capabilities
  const result: InitializeResult = {
    capabilities: {
      // Incremental sync is more efficient than full sync
      textDocumentSync: TextDocumentSyncKind.Incremental,

      // Completion
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: ['<', '"', "'", '/', '@', '=', ' ', '#']
      },

      // Hover
      hoverProvider: true,

      // Go to definition
      definitionProvider: true,

      // Find references
      referencesProvider: true,

      // Document symbols (outline)
      documentSymbolProvider: true,

      // Workspace symbols (Ctrl+T)
      workspaceSymbolProvider: true,

      // Document formatting
      documentFormattingProvider: true,
      documentRangeFormattingProvider: true,

      // Code actions (quick fixes, refactorings)
      codeActionProvider: {
        codeActionKinds: [
          CodeActionKind.QuickFix,
          CodeActionKind.Refactor,
          CodeActionKind.RefactorExtract,
          CodeActionKind.Source
        ]
      },

      // Rename
      renameProvider: {
        prepareProvider: true
      },

      // Document links (clickable hrefs)
      documentLinkProvider: {
        resolveProvider: true
      },

      // Folding ranges
      foldingRangeProvider: true,

      // Pull-based diagnostics (modern approach)
      diagnosticProvider: {
        interFileDependencies: true,
        workspaceDiagnostics: false
      }
    }
  };

  // Add workspace folder support if available
  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
        changeNotifications: true
      }
    };
  }

  return result;
});

connection.onInitialized(async () => {
  // Register for configuration changes
  if (hasConfigurationCapability) {
    connection.client.register(
      DidChangeConfigurationNotification.type,
      { section: 'ditaLanguageServer' }
    );
  }

  // Listen for workspace folder changes
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders(event => {
      connection.console.log('Workspace folder change event received.');
      workspaceService.updateWorkspaceFolders(event.added, event.removed);
    });
  }

  // Initial workspace indexing
  connection.console.log('Starting workspace indexing...');
  await workspaceService.indexWorkspace();
  await keySpaceService.buildKeySpace();
  connection.console.log('Workspace indexing complete.');
});

// ============================================================================
// Configuration
// ============================================================================

connection.onDidChangeConfiguration(change => {
  if (hasConfigurationCapability) {
    // Reset cached document settings
    clearDocumentSettings();
  }

  // Refresh diagnostics for all open documents
  connection.languages.diagnostics.refresh();
});

// ============================================================================
// Document Lifecycle
// ============================================================================

documents.onDidOpen(event => {
  connection.console.log(`Document opened: ${event.document.uri}`);
  workspaceService.addDocument(event.document);
});

documents.onDidChangeContent(change => {
  // Trigger diagnostics refresh on content change
  connection.languages.diagnostics.refresh();
  
  // Update workspace index
  workspaceService.updateDocument(change.document);
});

documents.onDidClose(event => {
  connection.console.log(`Document closed: ${event.document.uri}`);
  clearDocumentSettings(event.document.uri);
  workspaceService.removeDocument(event.document.uri);
});

// ============================================================================
// Diagnostics (Pull-based)
// ============================================================================

connection.languages.diagnostics.on(async (params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return {
      kind: DocumentDiagnosticReportKind.Full,
      items: []
    } satisfies DocumentDiagnosticReport;
  }

  const settings = await getDocumentSettings(
    document.uri,
    hasConfigurationCapability,
    connection
  );

  const diagnostics = await validateDITADocument(
    document,
    settings,
    workspaceService,
    keySpaceService,
    hasDiagnosticRelatedInformationCapability
  );

  return {
    kind: DocumentDiagnosticReportKind.Full,
    items: diagnostics
  } satisfies DocumentDiagnosticReport;
});

// ============================================================================
// Completion
// ============================================================================

connection.onCompletion(async (params: TextDocumentPositionParams): Promise<CompletionItem[]> => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return [];

  const settings = await getDocumentSettings(
    document.uri,
    hasConfigurationCapability,
    connection
  );

  return provideCompletions(
    document,
    params.position,
    settings,
    workspaceService,
    keySpaceService
  );
});

connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  return resolveCompletion(item);
});

// ============================================================================
// Hover
// ============================================================================

connection.onHover(async (params): Promise<Hover | null> => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return null;

  return provideHover(document, params.position, keySpaceService);
});

// ============================================================================
// Go to Definition
// ============================================================================

connection.onDefinition(async (params): Promise<Definition | null> => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return null;

  return provideDefinition(
    document,
    params.position,
    workspaceService,
    keySpaceService
  );
});

// ============================================================================
// Find References
// ============================================================================

connection.onReferences(async (params): Promise<Location[]> => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return [];

  return provideReferences(
    document,
    params.position,
    params.context,
    workspaceService
  );
});

// ============================================================================
// Document Symbols
// ============================================================================

connection.onDocumentSymbol(async (params): Promise<DocumentSymbol[]> => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return [];

  return provideDocumentSymbols(document);
});

connection.onWorkspaceSymbol(async (params) => {
  return provideWorkspaceSymbols(params.query, workspaceService);
});

// ============================================================================
// Code Actions
// ============================================================================

connection.onCodeAction(async (params): Promise<CodeAction[]> => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return [];

  return provideCodeActions(
    document,
    params.range,
    params.context,
    workspaceService
  );
});

// ============================================================================
// Formatting
// ============================================================================

connection.onDocumentFormatting(async (params): Promise<TextEdit[]> => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return [];

  const settings = await getDocumentSettings(
    document.uri,
    hasConfigurationCapability,
    connection
  );

  return provideFormatting(document, params.options, settings);
});

connection.onDocumentRangeFormatting(async (params): Promise<TextEdit[]> => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return [];

  const settings = await getDocumentSettings(
    document.uri,
    hasConfigurationCapability,
    connection
  );

  return provideRangeFormatting(document, params.range, params.options, settings);
});

// ============================================================================
// Rename
// ============================================================================

connection.onPrepareRename(async (params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return null;

  return prepareRename(document, params.position);
});

connection.onRenameRequest(async (params): Promise<WorkspaceEdit | null> => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return null;

  return provideRenameEdits(
    document,
    params.position,
    params.newName,
    workspaceService
  );
});

// ============================================================================
// Document Links
// ============================================================================

connection.onDocumentLinks(async (params): Promise<DocumentLink[]> => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return [];

  return provideDocumentLinks(document, workspaceService);
});

connection.onDocumentLinkResolve((link: DocumentLink): DocumentLink => {
  return resolveDocumentLink(link, workspaceService);
});

// ============================================================================
// Folding Ranges
// ============================================================================

connection.onFoldingRanges(async (params): Promise<FoldingRange[]> => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return [];

  return provideFoldingRanges(document);
});

// ============================================================================
// File Watcher Events
// ============================================================================

connection.onDidChangeWatchedFiles(async (params) => {
  connection.console.log('File change event received');
  
  for (const change of params.changes) {
    const uri = change.uri;
    
    // If a map file changed, rebuild key space
    if (uri.endsWith('.ditamap')) {
      connection.console.log(`Map file changed: ${uri}`);
      await keySpaceService.buildKeySpace();
    }
    
    // Refresh diagnostics
    connection.languages.diagnostics.refresh();
  }
});

// ============================================================================
// Custom Requests
// ============================================================================

// Get key space information
connection.onRequest('dita/getKeySpace', () => {
  return keySpaceService.getKeySpaceInfo();
});

// Set root map
connection.onRequest('dita/setRootMap', async (params: { uri: string }) => {
  await keySpaceService.setRootMap(params.uri);
  connection.languages.diagnostics.refresh();
  return { success: true };
});

// Validate entire workspace
connection.onRequest('dita/validateWorkspace', async () => {
  const results = await workspaceService.validateAllDocuments();
  return results;
});

// ============================================================================
// Start Server
// ============================================================================

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();

connection.console.log('DITA Language Server started');
```

### 5.3 Settings Management (server/src/settings.ts)

```typescript
/* --------------------------------------------------------------------------------------------
 * Settings Management
 * 
 * Handles configuration settings synchronization between client and server.
 * Settings are cached per document for performance.
 * ------------------------------------------------------------------------------------------ */

import { Connection } from 'vscode-languageserver/node';

export interface DITASettings {
  maxNumberOfProblems: number;
  dita: {
    version: 'auto' | '1.3' | '2.0';
  };
  validation: {
    enabled: boolean;
    schema: boolean;
    references: boolean;
    ids: boolean;
  };
  keys: {
    rootMap: string;
    autoDetect: boolean;
  };
  ditaval: {
    activeFile: string;
  };
  completion: {
    snippets: boolean;
  };
  formatting: {
    enabled: boolean;
    indentSize: number;
  };
}

export const defaultSettings: DITASettings = {
  maxNumberOfProblems: 1000,
  dita: {
    version: 'auto'
  },
  validation: {
    enabled: true,
    schema: true,
    references: true,
    ids: true
  },
  keys: {
    rootMap: '',
    autoDetect: true
  },
  ditaval: {
    activeFile: ''
  },
  completion: {
    snippets: true
  },
  formatting: {
    enabled: true,
    indentSize: 2
  }
};

// Global settings (used when workspace/configuration not supported)
let globalSettings: DITASettings = defaultSettings;

// Cache document settings
const documentSettings: Map<string, Thenable<DITASettings>> = new Map();

export function setGlobalSettings(settings: DITASettings): void {
  globalSettings = settings;
}

export function getDocumentSettings(
  resource: string,
  hasConfigurationCapability: boolean,
  connection: Connection
): Thenable<DITASettings> {
  if (!hasConfigurationCapability) {
    return Promise.resolve(globalSettings);
  }

  let result = documentSettings.get(resource);
  if (!result) {
    result = connection.workspace.getConfiguration({
      scopeUri: resource,
      section: 'ditaLanguageServer'
    }).then(config => {
      // Merge with defaults to ensure all properties exist
      return mergeSettings(defaultSettings, config || {});
    });
    documentSettings.set(resource, result);
  }
  return result;
}

export function clearDocumentSettings(resource?: string): void {
  if (resource) {
    documentSettings.delete(resource);
  } else {
    documentSettings.clear();
  }
}

function mergeSettings(defaults: DITASettings, overrides: Partial<DITASettings>): DITASettings {
  return {
    maxNumberOfProblems: overrides.maxNumberOfProblems ?? defaults.maxNumberOfProblems,
    dita: {
      ...defaults.dita,
      ...overrides.dita
    },
    validation: {
      ...defaults.validation,
      ...overrides.validation
    },
    keys: {
      ...defaults.keys,
      ...overrides.keys
    },
    ditaval: {
      ...defaults.ditaval,
      ...overrides.ditaval
    },
    completion: {
      ...defaults.completion,
      ...overrides.completion
    },
    formatting: {
      ...defaults.formatting,
      ...overrides.formatting
    }
  };
}
```

---

## 6. Language Features

### 6.1 Validation (server/src/features/validation.ts)

```typescript
/* --------------------------------------------------------------------------------------------
 * DITA Validation
 * 
 * Provides diagnostics for DITA documents:
 * - XML well-formedness
 * - DITA structure validation
 * - Reference validation (conref, keyref, href)
 * - ID validation
 * ------------------------------------------------------------------------------------------ */

import {
  Diagnostic,
  DiagnosticSeverity,
  DiagnosticRelatedInformation,
  Range,
  Position
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DITASettings } from '../settings';
import { KeySpaceService } from '../services/keySpace';
import { WorkspaceService } from '../services/workspaceService';

// Diagnostic codes
export const DiagnosticCodes = {
  // XML errors
  XML_PARSE_ERROR: 'DITA-XML-001',
  XML_UNCLOSED_TAG: 'DITA-XML-002',
  
  // DITA structure errors
  DITA_INVALID_ROOT: 'DITA-STRUCT-001',
  DITA_MISSING_TITLE: 'DITA-STRUCT-002',
  DITA_TASK_NO_STEPS: 'DITA-STRUCT-003',
  DITA_NESTED_SECTION: 'DITA-STRUCT-004',
  DITA_GLOSSENTRY_INVALID: 'DITA-STRUCT-005',
  
  // ID errors
  DITA_DUPLICATE_ID: 'DITA-ID-001',
  DITA_INVALID_ID: 'DITA-ID-002',
  DITA_MISSING_ID: 'DITA-ID-003',
  
  // Reference errors
  DITA_CONREF_FILE_NOT_FOUND: 'DITA-REF-001',
  DITA_CONREF_ELEMENT_NOT_FOUND: 'DITA-REF-002',
  DITA_CONREF_CIRCULAR: 'DITA-REF-003',
  DITA_KEYREF_UNDEFINED: 'DITA-REF-004',
  DITA_HREF_FILE_NOT_FOUND: 'DITA-REF-005',
  
  // Warnings
  DITA_NO_SHORTDESC: 'DITA-WARN-001',
  DITA_TITLE_TOO_LONG: 'DITA-WARN-002',
  DITA_DEEP_NESTING: 'DITA-WARN-003'
};

export async function validateDITADocument(
  document: TextDocument,
  settings: DITASettings,
  workspaceService: WorkspaceService,
  keySpaceService: KeySpaceService,
  hasRelatedInfo: boolean
): Promise<Diagnostic[]> {
  if (!settings.validation.enabled) {
    return [];
  }

  const text = document.getText();
  const diagnostics: Diagnostic[] = [];
  let problemCount = 0;

  // Helper to add diagnostics with limit check
  const addDiagnostic = (diagnostic: Diagnostic): boolean => {
    if (problemCount >= settings.maxNumberOfProblems) {
      return false;
    }
    diagnostics.push(diagnostic);
    problemCount++;
    return true;
  };

  // 1. XML Well-formedness
  const xmlErrors = validateXML(text, document);
  for (const error of xmlErrors) {
    if (!addDiagnostic(error)) break;
  }

  // 2. DITA Structure
  if (settings.validation.schema) {
    const structureErrors = validateDITAStructure(text, document, settings);
    for (const error of structureErrors) {
      if (!addDiagnostic(error)) break;
    }
  }

  // 3. ID Validation
  if (settings.validation.ids) {
    const idErrors = validateIDs(text, document, hasRelatedInfo);
    for (const error of idErrors) {
      if (!addDiagnostic(error)) break;
    }
  }

  // 4. Reference Validation
  if (settings.validation.references) {
    const refErrors = await validateReferences(
      text,
      document,
      workspaceService,
      keySpaceService
    );
    for (const error of refErrors) {
      if (!addDiagnostic(error)) break;
    }
  }

  return diagnostics;
}

// ----------------------------------------------------------------------------
// XML Validation
// ----------------------------------------------------------------------------

function validateXML(text: string, document: TextDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const lines = text.split(/\r?\n/);

  // Check for unclosed tags (simplified)
  const openTags: { name: string; line: number; char: number }[] = [];
  const tagPattern = /<\/?([a-zA-Z][\w:-]*)[^>]*\/?>/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match;

    // Reset regex for each line
    tagPattern.lastIndex = 0;

    while ((match = tagPattern.exec(line)) !== null) {
      const fullMatch = match[0];
      const tagName = match[1];
      const isClosing = fullMatch.startsWith('</');
      const isSelfClosing = fullMatch.endsWith('/>');

      if (isClosing) {
        // Find matching open tag
        const openIndex = openTags.findLastIndex(t => t.name === tagName);
        if (openIndex === -1) {
          diagnostics.push({
            severity: DiagnosticSeverity.Error,
            range: {
              start: { line: i, character: match.index },
              end: { line: i, character: match.index + fullMatch.length }
            },
            message: `Closing tag </${tagName}> has no matching opening tag`,
            source: 'dita-xml',
            code: DiagnosticCodes.XML_UNCLOSED_TAG
          });
        } else {
          openTags.splice(openIndex, 1);
        }
      } else if (!isSelfClosing) {
        openTags.push({ name: tagName, line: i, char: match.index });
      }
    }

    // Check for unclosed quotes in attributes
    const quoteCheck = line.match(/(\w+)=["'][^"']*$/);
    if (quoteCheck) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: {
          start: { line: i, character: 0 },
          end: { line: i, character: line.length }
        },
        message: 'Unclosed attribute value',
        source: 'dita-xml',
        code: DiagnosticCodes.XML_PARSE_ERROR
      });
    }
  }

  // Report unclosed tags at end
  for (const tag of openTags) {
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: {
        start: { line: tag.line, character: tag.char },
        end: { line: tag.line, character: tag.char + tag.name.length + 2 }
      },
      message: `Tag <${tag.name}> is never closed`,
      source: 'dita-xml',
      code: DiagnosticCodes.XML_UNCLOSED_TAG
    });
  }

  return diagnostics;
}

// ----------------------------------------------------------------------------
// DITA Structure Validation
// ----------------------------------------------------------------------------

function validateDITAStructure(
  text: string,
  document: TextDocument,
  settings: DITASettings
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  // Detect document type
  const rootMatch = text.match(/<(topic|concept|task|reference|glossentry|troubleshooting|map|bookmap)[\s>]/);
  if (!rootMatch) {
    // Only warn if it looks like DITA
    if (text.includes('<!DOCTYPE') && (text.includes('dita') || text.includes('DITA'))) {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
        message: 'Could not determine DITA document type from root element',
        source: 'dita-schema',
        code: DiagnosticCodes.DITA_INVALID_ROOT
      });
    }
    return diagnostics;
  }

  const docType = rootMatch[1];

  // Document-type specific validation
  switch (docType) {
    case 'task':
      validateTaskStructure(text, diagnostics);
      break;
    case 'glossentry':
      validateGlossentryStructure(text, diagnostics);
      break;
  }

  // Check for nested sections (not allowed in DITA)
  validateNoNestedSections(text, diagnostics);

  // Check for missing shortdesc (warning)
  if (!/<shortdesc[\s>]/.test(text)) {
    const titleMatch = text.match(/<title[\s>]/);
    if (titleMatch) {
      diagnostics.push({
        severity: DiagnosticSeverity.Information,
        range: getRangeFromIndex(text, titleMatch.index || 0, 10),
        message: 'Consider adding a <shortdesc> element for better discoverability',
        source: 'dita-style',
        code: DiagnosticCodes.DITA_NO_SHORTDESC
      });
    }
  }

  return diagnostics;
}

function validateTaskStructure(text: string, diagnostics: Diagnostic[]): void {
  // Task must have steps or steps-informal
  if (!/<(steps|steps-informal|steps-unordered)[\s>]/.test(text)) {
    const taskbodyMatch = text.match(/<taskbody[\s>]/);
    if (taskbodyMatch) {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: getRangeFromIndex(text, taskbodyMatch.index || 0, 12),
        message: 'Task should contain <steps>, <steps-informal>, or <steps-unordered>',
        source: 'dita-rules',
        code: DiagnosticCodes.DITA_TASK_NO_STEPS
      });
    }
  }
}

function validateGlossentryStructure(text: string, diagnostics: Diagnostic[]): void {
  if (!/<glossterm[\s>]/.test(text)) {
    diagnostics.push({
      severity: DiagnosticSeverity.Error,
      range: { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } },
      message: 'Glossentry requires <glossterm> element',
      source: 'dita-rules',
      code: DiagnosticCodes.DITA_GLOSSENTRY_INVALID
    });
  }
}

function validateNoNestedSections(text: string, diagnostics: Diagnostic[]): void {
  // Simple nested section detection
  const sectionStarts: number[] = [];
  let depth = 0;
  const regex = /<\/?section[\s>]/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match[0].startsWith('</')) {
      depth--;
    } else {
      if (depth > 0) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: getRangeFromIndex(text, match.index, 10),
          message: 'Sections cannot be nested in DITA',
          source: 'dita-rules',
          code: DiagnosticCodes.DITA_NESTED_SECTION
        });
      }
      depth++;
    }
  }
}

// ----------------------------------------------------------------------------
// ID Validation
// ----------------------------------------------------------------------------

function validateIDs(
  text: string,
  document: TextDocument,
  hasRelatedInfo: boolean
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const idPattern = /\bid=["']([^"']+)["']/g;
  const ids = new Map<string, { line: number; character: number }[]>();
  let match;

  while ((match = idPattern.exec(text)) !== null) {
    const id = match[1];
    const position = getPositionFromIndex(text, match.index);

    // Check for invalid ID format
    if (!/^[a-zA-Z_][\w.-]*$/.test(id)) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: {
          start: position,
          end: { line: position.line, character: position.character + match[0].length }
        },
        message: `Invalid ID format: "${id}". IDs must start with a letter or underscore.`,
        source: 'dita-rules',
        code: DiagnosticCodes.DITA_INVALID_ID
      });
    }

    // Track all occurrences for duplicate detection
    if (!ids.has(id)) {
      ids.set(id, []);
    }
    ids.get(id)!.push(position);
  }

  // Check for duplicates
  for (const [id, positions] of ids) {
    if (positions.length > 1) {
      for (let i = 1; i < positions.length; i++) {
        const diagnostic: Diagnostic = {
          severity: DiagnosticSeverity.Error,
          range: {
            start: positions[i],
            end: { line: positions[i].line, character: positions[i].character + id.length + 5 }
          },
          message: `Duplicate ID "${id}"`,
          source: 'dita-rules',
          code: DiagnosticCodes.DITA_DUPLICATE_ID
        };

        // Add related information pointing to first occurrence
        if (hasRelatedInfo) {
          diagnostic.relatedInformation = [
            {
              location: {
                uri: document.uri,
                range: {
                  start: positions[0],
                  end: { line: positions[0].line, character: positions[0].character + id.length + 5 }
                }
              },
              message: 'First defined here'
            }
          ];
        }

        diagnostics.push(diagnostic);
      }
    }
  }

  return diagnostics;
}

// ----------------------------------------------------------------------------
// Reference Validation
// ----------------------------------------------------------------------------

async function validateReferences(
  text: string,
  document: TextDocument,
  workspaceService: WorkspaceService,
  keySpaceService: KeySpaceService
): Promise<Diagnostic[]> {
  const diagnostics: Diagnostic[] = [];

  // Validate conrefs
  const conrefPattern = /\bconref=["']([^"']+)["']/g;
  let match;

  while ((match = conrefPattern.exec(text)) !== null) {
    const conrefValue = match[1];
    const position = getPositionFromIndex(text, match.index);
    
    // Parse conref: file.dita#topic/element
    const [filePart] = conrefValue.split('#');
    
    if (filePart) {
      const resolved = await workspaceService.resolveRelativePath(document.uri, filePart);
      if (!resolved) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: {
            start: position,
            end: { line: position.line, character: position.character + match[0].length }
          },
          message: `Conref target file not found: ${filePart}`,
          source: 'dita-references',
          code: DiagnosticCodes.DITA_CONREF_FILE_NOT_FOUND
        });
      }
    }
  }

  // Validate keyrefs
  const keyrefPattern = /\bkeyref=["']([^"']+)["']/g;

  while ((match = keyrefPattern.exec(text)) !== null) {
    const keyName = match[1].split('/')[0]; // Handle key/element syntax
    const position = getPositionFromIndex(text, match.index);

    if (!keySpaceService.hasKey(keyName)) {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: {
          start: position,
          end: { line: position.line, character: position.character + match[0].length }
        },
        message: `Key "${keyName}" is not defined in the key space`,
        source: 'dita-references',
        code: DiagnosticCodes.DITA_KEYREF_UNDEFINED
      });
    }
  }

  // Validate hrefs (for topicrefs, xrefs)
  const hrefPattern = /\bhref=["']([^"'#]+)/g;

  while ((match = hrefPattern.exec(text)) !== null) {
    const hrefValue = match[1];
    const position = getPositionFromIndex(text, match.index);

    // Skip external URLs
    if (hrefValue.startsWith('http://') || hrefValue.startsWith('https://')) {
      continue;
    }

    const resolved = await workspaceService.resolveRelativePath(document.uri, hrefValue);
    if (!resolved) {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: {
          start: position,
          end: { line: position.line, character: position.character + match[0].length }
        },
        message: `Referenced file not found: ${hrefValue}`,
        source: 'dita-references',
        code: DiagnosticCodes.DITA_HREF_FILE_NOT_FOUND
      });
    }
  }

  return diagnostics;
}

// ----------------------------------------------------------------------------
// Utility Functions
// ----------------------------------------------------------------------------

function getPositionFromIndex(text: string, index: number): Position {
  const lines = text.substring(0, index).split(/\r?\n/);
  return {
    line: lines.length - 1,
    character: lines[lines.length - 1].length
  };
}

function getRangeFromIndex(text: string, index: number, length: number): Range {
  const start = getPositionFromIndex(text, index);
  return {
    start,
    end: { line: start.line, character: start.character + length }
  };
}
```

### 6.2 Completion Provider (server/src/features/completion.ts)

```typescript
/* --------------------------------------------------------------------------------------------
 * DITA Completion Provider
 * 
 * Provides context-aware completions for:
 * - Elements (based on parent element)
 * - Attributes (based on element)
 * - Attribute values (including key suggestions)
 * - Snippets for complex structures
 * ------------------------------------------------------------------------------------------ */

import {
  CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
  Position,
  MarkupKind
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DITASettings } from '../settings';
import { KeySpaceService } from '../services/keySpace';
import { WorkspaceService } from '../services/workspaceService';

// Completion context types
enum CompletionContext {
  ELEMENT_NAME,       // After '<'
  ATTRIBUTE_NAME,     // Inside opening tag after space
  ATTRIBUTE_VALUE,    // After '="' or "='"
  ELEMENT_CONTENT,    // Inside element content
  UNKNOWN
}

export function provideCompletions(
  document: TextDocument,
  position: Position,
  settings: DITASettings,
  workspaceService: WorkspaceService,
  keySpaceService: KeySpaceService
): CompletionItem[] {
  const text = document.getText();
  const offset = document.offsetAt(position);
  const linePrefix = getLinePrefix(text, offset);
  const context = determineContext(linePrefix, text, offset);

  switch (context.type) {
    case CompletionContext.ELEMENT_NAME:
      return getElementCompletions(context.parentElement, settings);
    
    case CompletionContext.ATTRIBUTE_NAME:
      return getAttributeCompletions(context.elementName);
    
    case CompletionContext.ATTRIBUTE_VALUE:
      return getAttributeValueCompletions(
        context.attributeName,
        document.uri,
        workspaceService,
        keySpaceService
      );
    
    default:
      return [];
  }
}

export function resolveCompletion(item: CompletionItem): CompletionItem {
  // Add detailed documentation for specific items
  if (item.data?.type === 'element') {
    const docs = getElementDocumentation(item.label as string);
    if (docs) {
      item.documentation = {
        kind: MarkupKind.Markdown,
        value: docs
      };
    }
  }
  return item;
}

// ----------------------------------------------------------------------------
// Context Detection
// ----------------------------------------------------------------------------

interface ContextInfo {
  type: CompletionContext;
  parentElement?: string;
  elementName?: string;
  attributeName?: string;
}

function determineContext(linePrefix: string, text: string, offset: number): ContextInfo {
  // After '<' - element completion
  if (/<[a-zA-Z]*$/.test(linePrefix)) {
    const parentElement = findParentElement(text, offset);
    return { type: CompletionContext.ELEMENT_NAME, parentElement };
  }

  // Inside attribute value
  const attrValueMatch = linePrefix.match(/(\w+)=["'][^"']*$/);
  if (attrValueMatch) {
    return {
      type: CompletionContext.ATTRIBUTE_VALUE,
      attributeName: attrValueMatch[1]
    };
  }

  // Inside opening tag (attribute completion)
  const tagMatch = linePrefix.match(/<([a-zA-Z][\w:-]*)\s+[^>]*$/);
  if (tagMatch) {
    return {
      type: CompletionContext.ATTRIBUTE_NAME,
      elementName: tagMatch[1]
    };
  }

  return { type: CompletionContext.UNKNOWN };
}

function findParentElement(text: string, offset: number): string | undefined {
  // Simple parent element detection
  const beforeCursor = text.substring(0, offset);
  const openTags: string[] = [];
  const tagRegex = /<\/?([a-zA-Z][\w:-]*)[^>]*>/g;
  let match;

  while ((match = tagRegex.exec(beforeCursor)) !== null) {
    const tagName = match[1];
    if (match[0].startsWith('</')) {
      openTags.pop();
    } else if (!match[0].endsWith('/>')) {
      openTags.push(tagName);
    }
  }

  return openTags.length > 0 ? openTags[openTags.length - 1] : undefined;
}

function getLinePrefix(text: string, offset: number): string {
  const lineStart = text.lastIndexOf('\n', offset - 1) + 1;
  return text.substring(lineStart, offset);
}

// ----------------------------------------------------------------------------
// Element Completions
// ----------------------------------------------------------------------------

const DITA_ELEMENTS = {
  // Topic level
  topic: ['title', 'shortdesc', 'prolog', 'body', 'related-links', 'topic'],
  concept: ['title', 'shortdesc', 'prolog', 'conbody', 'related-links'],
  task: ['title', 'shortdesc', 'prolog', 'taskbody', 'related-links'],
  reference: ['title', 'shortdesc', 'prolog', 'refbody', 'related-links'],
  
  // Body elements
  body: ['p', 'ul', 'ol', 'dl', 'sl', 'section', 'table', 'simpletable', 'fig', 'note', 'codeblock', 'pre', 'lines', 'lq', 'image'],
  conbody: ['p', 'ul', 'ol', 'dl', 'sl', 'section', 'table', 'simpletable', 'fig', 'note', 'codeblock', 'example'],
  taskbody: ['prereq', 'context', 'steps', 'steps-informal', 'steps-unordered', 'result', 'tasktroubleshooting', 'example', 'postreq'],
  refbody: ['refsyn', 'section', 'table', 'simpletable', 'properties', 'example'],
  
  // List elements
  ul: ['li'],
  ol: ['li'],
  dl: ['dlentry'],
  dlentry: ['dt', 'dd'],
  sl: ['sli'],
  
  // Task elements
  steps: ['step', 'stepsection'],
  'steps-unordered': ['step', 'stepsection'],
  step: ['cmd', 'info', 'substeps', 'stepxmp', 'choices', 'choicetable', 'stepresult', 'steptroubleshooting'],
  substeps: ['substep'],
  substep: ['cmd', 'info', 'stepxmp', 'stepresult'],
  
  // Table elements
  table: ['title', 'desc', 'tgroup'],
  tgroup: ['colspec', 'thead', 'tbody'],
  thead: ['row'],
  tbody: ['row'],
  row: ['entry'],
  simpletable: ['sthead', 'strow'],
  sthead: ['stentry'],
  strow: ['stentry'],
  
  // Other
  section: ['title', 'p', 'ul', 'ol', 'dl', 'table', 'simpletable', 'fig', 'note', 'codeblock'],
  fig: ['title', 'desc', 'image'],
  note: ['p', 'ul', 'ol'],
  
  // Map elements
  map: ['title', 'topicmeta', 'topicref', 'reltable', 'keydef'],
  bookmap: ['title', 'bookmeta', 'frontmatter', 'chapter', 'part', 'appendix', 'backmatter', 'reltable'],
  topicref: ['topicmeta', 'topicref'],
  chapter: ['topicmeta', 'topicref'],
  keydef: ['topicmeta']
};

function getElementCompletions(parentElement: string | undefined, settings: DITASettings): CompletionItem[] {
  const items: CompletionItem[] = [];
  
  // Get valid children for parent
  let validElements: string[] = [];
  if (parentElement && DITA_ELEMENTS[parentElement as keyof typeof DITA_ELEMENTS]) {
    validElements = DITA_ELEMENTS[parentElement as keyof typeof DITA_ELEMENTS];
  } else {
    // Root elements or unknown parent - show common elements
    validElements = ['topic', 'concept', 'task', 'reference', 'glossentry', 'map', 'bookmap'];
  }

  for (const element of validElements) {
    items.push({
      label: element,
      kind: CompletionItemKind.Class,
      data: { type: 'element', element },
      insertTextFormat: InsertTextFormat.PlainText
    });
  }

  // Add snippets if enabled
  if (settings.completion.snippets) {
    items.push(...getSnippetCompletions(parentElement));
  }

  return items;
}

// ----------------------------------------------------------------------------
// Snippets
// ----------------------------------------------------------------------------

function getSnippetCompletions(parentElement: string | undefined): CompletionItem[] {
  const snippets: CompletionItem[] = [];

  // Context-aware snippets
  if (parentElement === 'steps' || parentElement === 'steps-unordered') {
    snippets.push({
      label: 'step (snippet)',
      kind: CompletionItemKind.Snippet,
      insertText: '<step>\n\t<cmd>${1:Command}</cmd>\n\t<info>${2:Additional information}</info>\n</step>',
      insertTextFormat: InsertTextFormat.Snippet,
      detail: 'Insert a complete step with cmd and info',
      sortText: '0step'
    });
  }

  if (!parentElement || ['body', 'conbody', 'section'].includes(parentElement)) {
    snippets.push(
      {
        label: 'ul (snippet)',
        kind: CompletionItemKind.Snippet,
        insertText: '<ul>\n\t<li>${1:Item}</li>\n\t<li>${2:Item}</li>\n</ul>',
        insertTextFormat: InsertTextFormat.Snippet,
        detail: 'Unordered list with two items',
        sortText: '0ul'
      },
      {
        label: 'table (snippet)',
        kind: CompletionItemKind.Snippet,
        insertText: `<table>
\t<title>\${1:Table Title}</title>
\t<tgroup cols="2">
\t\t<colspec colname="c1"/>
\t\t<colspec colname="c2"/>
\t\t<thead>
\t\t\t<row>
\t\t\t\t<entry>\${2:Header 1}</entry>
\t\t\t\t<entry>\${3:Header 2}</entry>
\t\t\t</row>
\t\t</thead>
\t\t<tbody>
\t\t\t<row>
\t\t\t\t<entry>\${4:Cell}</entry>
\t\t\t\t<entry>\${5:Cell}</entry>
\t\t\t</row>
\t\t</tbody>
\t</tgroup>
</table>`,
        insertTextFormat: InsertTextFormat.Snippet,
        detail: 'Insert a complete table structure',
        sortText: '0table'
      },
      {
        label: 'codeblock (snippet)',
        kind: CompletionItemKind.Snippet,
        insertText: '<codeblock outputclass="language-${1|xml,java,python,javascript,json,bash|}">\n${2:code}\n</codeblock>',
        insertTextFormat: InsertTextFormat.Snippet,
        detail: 'Code block with language selection',
        sortText: '0codeblock'
      },
      {
        label: 'note (snippet)',
        kind: CompletionItemKind.Snippet,
        insertText: '<note type="${1|note,tip,important,remember,restriction,caution,warning,danger|}">\n\t<p>${2:Note content}</p>\n</note>',
        insertTextFormat: InsertTextFormat.Snippet,
        detail: 'Note with type selection',
        sortText: '0note'
      }
    );
  }

  return snippets;
}

// ----------------------------------------------------------------------------
// Attribute Completions
// ----------------------------------------------------------------------------

const COMMON_ATTRIBUTES = ['id', 'conref', 'conkeyref', 'keyref', 'outputclass', 'props', 'audience', 'platform', 'product', 'otherprops', 'rev', 'status', 'importance', 'xml:lang', 'dir', 'translate'];

const ELEMENT_ATTRIBUTES: Record<string, string[]> = {
  topicref: ['href', 'keys', 'keyref', 'format', 'scope', 'type', 'navtitle', 'locktitle', 'collection-type', 'processing-role', 'toc', 'print'],
  keydef: ['keys', 'href', 'format', 'scope', 'processing-role'],
  xref: ['href', 'keyref', 'format', 'scope', 'type'],
  image: ['href', 'keyref', 'placement', 'scale', 'scalefit', 'width', 'height', 'align'],
  note: ['type', 'spectitle'],
  codeblock: ['outputclass', 'scale', 'frame', 'expanse'],
  table: ['frame', 'colsep', 'rowsep', 'pgwide', 'rowheader'],
  tgroup: ['cols', 'colsep', 'rowsep', 'align'],
  colspec: ['colnum', 'colname', 'colwidth', 'colsep', 'rowsep', 'align'],
  entry: ['namest', 'nameend', 'morerows', 'colsep', 'rowsep', 'align', 'valign'],
  ph: ['keyref'],
  term: ['keyref'],
  keyword: ['keyref']
};

function getAttributeCompletions(elementName: string): CompletionItem[] {
  const items: CompletionItem[] = [];
  const elementSpecific = ELEMENT_ATTRIBUTES[elementName] || [];
  const allAttributes = [...new Set([...elementSpecific, ...COMMON_ATTRIBUTES])];

  for (const attr of allAttributes) {
    const isElementSpecific = elementSpecific.includes(attr);
    items.push({
      label: attr,
      kind: CompletionItemKind.Property,
      insertText: `${attr}="\${1}"`,
      insertTextFormat: InsertTextFormat.Snippet,
      sortText: isElementSpecific ? `0${attr}` : `1${attr}`,
      detail: isElementSpecific ? `(${elementName} attribute)` : '(common attribute)'
    });
  }

  return items;
}

// ----------------------------------------------------------------------------
// Attribute Value Completions
// ----------------------------------------------------------------------------

function getAttributeValueCompletions(
  attributeName: string,
  documentUri: string,
  workspaceService: WorkspaceService,
  keySpaceService: KeySpaceService
): CompletionItem[] {
  const items: CompletionItem[] = [];

  switch (attributeName) {
    case 'keyref':
    case 'conkeyref':
      // Suggest keys from key space
      for (const key of keySpaceService.getAllKeys()) {
        items.push({
          label: key.name,
          kind: CompletionItemKind.Reference,
          detail: key.href ? `→ ${key.href}` : '(no href)',
          documentation: key.definition ? `Defined in: ${key.definition}` : undefined
        });
      }
      break;

    case 'outputclass':
      items.push(
        { label: 'language-xml', kind: CompletionItemKind.EnumMember },
        { label: 'language-java', kind: CompletionItemKind.EnumMember },
        { label: 'language-python', kind: CompletionItemKind.EnumMember },
        { label: 'language-javascript', kind: CompletionItemKind.EnumMember },
        { label: 'language-typescript', kind: CompletionItemKind.EnumMember },
        { label: 'language-json', kind: CompletionItemKind.EnumMember },
        { label: 'language-yaml', kind: CompletionItemKind.EnumMember },
        { label: 'language-bash', kind: CompletionItemKind.EnumMember },
        { label: 'language-sql', kind: CompletionItemKind.EnumMember }
      );
      break;

    case 'type': // for note element
      items.push(
        { label: 'note', kind: CompletionItemKind.EnumMember, detail: 'General note' },
        { label: 'tip', kind: CompletionItemKind.EnumMember, detail: 'Helpful tip' },
        { label: 'important', kind: CompletionItemKind.EnumMember, detail: 'Important information' },
        { label: 'remember', kind: CompletionItemKind.EnumMember, detail: 'Reminder' },
        { label: 'restriction', kind: CompletionItemKind.EnumMember, detail: 'Restriction or limitation' },
        { label: 'caution', kind: CompletionItemKind.EnumMember, detail: 'Caution notice' },
        { label: 'warning', kind: CompletionItemKind.EnumMember, detail: 'Warning notice' },
        { label: 'danger', kind: CompletionItemKind.EnumMember, detail: 'Danger notice' }
      );
      break;

    case 'scope':
      items.push(
        { label: 'local', kind: CompletionItemKind.EnumMember, detail: 'Same documentation set' },
        { label: 'peer', kind: CompletionItemKind.EnumMember, detail: 'Same system, different set' },
        { label: 'external', kind: CompletionItemKind.EnumMember, detail: 'External resource' }
      );
      break;

    case 'format':
      items.push(
        { label: 'dita', kind: CompletionItemKind.EnumMember },
        { label: 'ditamap', kind: CompletionItemKind.EnumMember },
        { label: 'html', kind: CompletionItemKind.EnumMember },
        { label: 'pdf', kind: CompletionItemKind.EnumMember },
        { label: 'markdown', kind: CompletionItemKind.EnumMember }
      );
      break;

    case 'audience':
      items.push(
        { label: 'administrator', kind: CompletionItemKind.EnumMember },
        { label: 'developer', kind: CompletionItemKind.EnumMember },
        { label: 'user', kind: CompletionItemKind.EnumMember },
        { label: 'expert', kind: CompletionItemKind.EnumMember },
        { label: 'novice', kind: CompletionItemKind.EnumMember }
      );
      break;

    case 'platform':
      items.push(
        { label: 'windows', kind: CompletionItemKind.EnumMember },
        { label: 'linux', kind: CompletionItemKind.EnumMember },
        { label: 'macos', kind: CompletionItemKind.EnumMember },
        { label: 'unix', kind: CompletionItemKind.EnumMember },
        { label: 'web', kind: CompletionItemKind.EnumMember }
      );
      break;

    case 'placement': // for image
      items.push(
        { label: 'inline', kind: CompletionItemKind.EnumMember },
        { label: 'break', kind: CompletionItemKind.EnumMember }
      );
      break;
  }

  return items;
}

// ----------------------------------------------------------------------------
// Documentation
// ----------------------------------------------------------------------------

function getElementDocumentation(element: string): string | undefined {
  const docs: Record<string, string> = {
    topic: '## topic\n\nThe base topic type. Use when content doesn\'t fit other specialized types.\n\n**Children:** title, shortdesc, prolog, body, related-links, topic',
    concept: '## concept\n\nConceptual information that helps users understand a system.\n\n**Use for:** Background, overviews, principles\n\n**Children:** title, shortdesc, prolog, conbody, related-links',
    task: '## task\n\nProcedural information with step-by-step instructions.\n\n**Use for:** How-to content, procedures\n\n**Children:** title, shortdesc, prolog, taskbody, related-links',
    reference: '## reference\n\nDetailed lookup information.\n\n**Use for:** API docs, command references, specifications\n\n**Children:** title, shortdesc, prolog, refbody, related-links',
    step: '## step\n\nA single step in a task procedure.\n\n**Required:** `<cmd>` element\n\n**Optional:** info, substeps, stepxmp, choices, stepresult',
    note: '## note\n\nAdditional information that stands out from body text.\n\n**Types:** note, tip, important, remember, restriction, caution, warning, danger',
    codeblock: '## codeblock\n\nPreformatted code or command text.\n\n**Tip:** Use `outputclass="language-xxx"` for syntax highlighting',
    xref: '## xref\n\nCross-reference to another topic or external resource.\n\n**Attributes:** href, keyref, format, scope'
  };

  return docs[element];
}
```

---

## 7. Testing

### 7.1 Test Approach

Following the VS Code LSP guide, there are two testing approaches:

1. **Unit Tests**: Test server logic in isolation by mocking LSP messages
2. **End-to-End Tests**: Test the complete extension in VS Code

### 7.2 E2E Test Helper (client/src/test/helper.ts)

```typescript
import * as vscode from 'vscode';
import * as path from 'path';

export let doc: vscode.TextDocument;
export let editor: vscode.TextEditor;

/**
 * Activates the extension and waits for it to be ready
 */
export async function activate(docUri: vscode.Uri): Promise<void> {
  const ext = vscode.extensions.getExtension('jyjeanne.dita-lsp');
  if (!ext) {
    throw new Error('Extension not found');
  }
  
  await ext.activate();
  
  try {
    doc = await vscode.workspace.openTextDocument(docUri);
    editor = await vscode.window.showTextDocument(doc);
    // Wait for server to process the document
    await sleep(2000);
  } catch (e) {
    console.error('Failed to activate:', e);
    throw e;
  }
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getDocPath(p: string): string {
  return path.resolve(__dirname, '../../../testFixture', p);
}

export function getDocUri(p: string): vscode.Uri {
  return vscode.Uri.file(getDocPath(p));
}

/**
 * Replace document content for testing
 */
export async function setTestContent(content: string): Promise<boolean> {
  const all = new vscode.Range(
    doc.positionAt(0),
    doc.positionAt(doc.getText().length)
  );
  return editor.edit(eb => eb.replace(all, content));
}
```

### 7.3 Diagnostics Test (client/src/test/diagnostics.test.ts)

```typescript
import * as vscode from 'vscode';
import * as assert from 'assert';
import { getDocUri, activate, sleep } from './helper';

suite('DITA Diagnostics', () => {
  const docUri = getDocUri('topics/with-errors.dita');

  test('Should report duplicate ID errors', async () => {
    await activate(docUri);
    
    // Wait for diagnostics
    await sleep(1000);
    
    const diagnostics = vscode.languages.getDiagnostics(docUri);
    const duplicateIdErrors = diagnostics.filter(d => 
      d.code === 'DITA-ID-001'
    );
    
    assert.ok(
      duplicateIdErrors.length > 0,
      'Expected at least one duplicate ID error'
    );
  });

  test('Should report broken conref errors', async () => {
    await activate(docUri);
    await sleep(1000);
    
    const diagnostics = vscode.languages.getDiagnostics(docUri);
    const conrefErrors = diagnostics.filter(d =>
      d.code === 'DITA-REF-001'
    );
    
    assert.ok(
      conrefErrors.length > 0,
      'Expected broken conref error'
    );
  });
});
```

### 7.4 Completion Test (client/src/test/completion.test.ts)

```typescript
import * as vscode from 'vscode';
import * as assert from 'assert';
import { getDocUri, activate } from './helper';

suite('DITA Completion', () => {
  const docUri = getDocUri('completion.dita');

  test('Should provide element completions after <', async () => {
    await activate(docUri);
    
    const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
      'vscode.executeCompletionItemProvider',
      docUri,
      new vscode.Position(5, 5) // Position after '<' in body
    );
    
    assert.ok(completions.items.length > 0, 'Expected completions');
    
    const labels = completions.items.map(i => i.label);
    assert.ok(labels.includes('p'), 'Expected <p> completion');
    assert.ok(labels.includes('ul'), 'Expected <ul> completion');
    assert.ok(labels.includes('note'), 'Expected <note> completion');
  });

  test('Should provide attribute completions', async () => {
    await activate(docUri);
    
    const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
      'vscode.executeCompletionItemProvider',
      docUri,
      new vscode.Position(3, 10) // Position inside <p > tag
    );
    
    const labels = completions.items.map(i => i.label);
    assert.ok(labels.includes('id'), 'Expected id attribute');
    assert.ok(labels.includes('conref'), 'Expected conref attribute');
  });
});
```

---

## 8. Logging and Debugging

### 8.1 Server-Side Logging

```typescript
// Use connection.console for logging
connection.console.log('Info message');
connection.console.info('Info message');
connection.console.warn('Warning message');
connection.console.error('Error message');
```

### 8.2 Trace Configuration

The `ditaLanguageServer.trace.server` setting enables LSP message tracing:

- `"off"`: No tracing
- `"messages"`: Log request/response messages
- `"verbose"`: Log message + parameters

View traces in the "DITA LSP Trace" output channel.

### 8.3 Debug Launch Configuration

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Client",
      "type": "extensionHost",
      "request": "launch",
      "runtimeExecutable": "${execPath}",
      "args": ["--extensionDevelopmentPath=${workspaceRoot}"],
      "outFiles": ["${workspaceRoot}/client/out/**/*.js"],
      "preLaunchTask": "npm: compile"
    },
    {
      "name": "Attach to Server",
      "type": "node",
      "request": "attach",
      "port": 6009,
      "restart": true,
      "outFiles": ["${workspaceRoot}/server/out/**/*.js"]
    },
    {
      "name": "E2E Tests",
      "type": "extensionHost",
      "request": "launch",
      "runtimeExecutable": "${execPath}",
      "args": [
        "--extensionDevelopmentPath=${workspaceRoot}",
        "--extensionTestsPath=${workspaceRoot}/client/out/test/index",
        "${workspaceRoot}/testFixture"
      ],
      "outFiles": ["${workspaceRoot}/client/out/test/**/*.js"]
    }
  ],
  "compounds": [
    {
      "name": "Client + Server",
      "configurations": ["Launch Client", "Attach to Server"]
    }
  ]
}
```

---

## 9. Advanced Topics

### 9.1 Incremental Text Synchronization

The server uses `TextDocumentSyncKind.Incremental` for efficient document updates:

```typescript
// Only changed portions are sent, not the entire document
documents.onDidChangeContent((change) => {
  // change.document contains the updated document
  // VS Code sends incremental changes
});
```

### 9.2 Error-Tolerant Parsing

For a production DITA LSP, implement an error-tolerant XML parser that:

1. Continues parsing after errors
2. Provides partial AST for incomplete documents
3. Recovers from common mistakes (unclosed tags, missing quotes)

Consider using libraries like:
- `sax` with error recovery
- Custom parser with recovery heuristics
- Web-assembly based parser for performance

### 9.3 Multi-Root Workspace Support

Handle multiple workspace folders:

```typescript
connection.workspace.onDidChangeWorkspaceFolders((event) => {
  for (const added of event.added) {
    // Index new workspace folder
  }
  for (const removed of event.removed) {
    // Remove from index
  }
});
```

### 9.4 Pull vs Push Diagnostics

This specification uses **pull-based diagnostics** (modern approach):

```typescript
connection.languages.diagnostics.on(async (params) => {
  // Return diagnostics on demand
  return { kind: DocumentDiagnosticReportKind.Full, items: diagnostics };
});
```

For push-based (legacy), use:

```typescript
connection.sendDiagnostics({ uri: document.uri, diagnostics });
```

---

## 10. Document Revision History

| Version | Date | Changes |
|---------|------|---------|
| 3.0.0 | Feb 2026 | Complete rewrite following VS Code LSP guide |
| 2.0.0 | Feb 2026 | Aligned with Microsoft lsp-sample |
| 1.0.0 | Feb 2026 | Initial specification |

---

*End of Specification*
