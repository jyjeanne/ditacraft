# DitaCraft Architecture

**Technical Architecture Documentation**
*Version: 0.6.2 | Last Updated: March 2026*

This document describes the architecture, component responsibilities, data flows, and design decisions of the DitaCraft VS Code extension.

---

## Table of Contents

1. [Overview](#overview)
2. [Layer Architecture](#layer-architecture)
3. [Component Responsibilities](#component-responsibilities)
4. [Data Flow Diagrams](#data-flow-diagrams)
5. [Extension Lifecycle](#extension-lifecycle)
6. [Caching Strategies](#caching-strategies)
7. [Design Patterns](#design-patterns)
8. [Security Considerations](#security-considerations)

---

## Overview

DitaCraft is a VS Code extension providing comprehensive DITA authoring support through a **client-server architecture**:

- **Client (Extension Host):** UI commands, file creation, publishing, preview, activity bar views
- **LSP Server (Separate Process):** Validation, IntelliSense, navigation, formatting, code actions

### Technology Stack

| Component | Technology |
|-----------|------------|
| Client Runtime | VS Code Extension Host (Node.js) |
| LSP Server | vscode-languageserver 9.x (Node.js IPC) |
| Language | TypeScript 5.x |
| XML Parsing | fast-xml-parser, @xmldom/xmldom |
| DTD Validation | TypesXML + OASIS XML Catalog (bundled) |
| RNG Validation | salve-annos + saxes (optional) |
| XML Tokenizer | Custom state-machine (8 states, 22 token types) |
| Publishing | DITA-OT (external) |
| Testing | Mocha + VS Code Extension Test API |
| Test Count | 1082 tests (652 client + 430 server) |

---

## Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    VS CODE EXTENSION HOST                        │
│  (Event Bus, File System, Text Editors, Output Channels)         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────────┐
        │                  │                      │
   ┌────▼─────┐     ┌──────▼──────┐       ┌──────▼──────┐
   │ Commands │     │  Providers  │       │   Utils     │
   └──────────┘     └─────────────┘       └─────────────┘
   │ validate │     │ ditaValidator│      │ ditaOtWrapper│
   │ publish  │     │ linkProvider │      │ keySpaceRes. │
   │ preview  │     │ diagView     │      │ configManager│
   │ newFile  │     │ ditaExplorer │      │ rateLimiter  │
   │ setRoot  │     │ keySpaceView │      │ logger       │
   │ cSpell   │     │ fileDecorat. │      │ errorUtils   │
   └──────────┘     │ previewPanel │      └─────────────┘
                    │ mapVisualizer│
                    └─────────────┘
                           │
                    ┌──────▼──────────────────────────────────┐
                    │          Language Server (IPC)           │
                    ├─────────────────────────────────────────┤
                    │  Features:     │  Services:              │
                    │  validation    │  keySpaceService        │
                    │  completion    │  subjectSchemeService   │
                    │  hover         │  catalogValidation      │
                    │  definition    │  rngValidation          │
                    │  references    │                         │
                    │  rename        │  Utils:                 │
                    │  formatting    │  xmlTokenizer           │
                    │  codeActions   │  referenceParser        │
                    │  folding       │  ditaVersionDetector    │
                    │  linkedEditing │  workspaceScanner       │
                    │  documentLinks │  i18n                   │
                    │  symbols       │                         │
                    │  crossRefValid │  Data:                  │
                    │  ditaRules     │  ditaSchema             │
                    │  profiling     │  ditaSpecialization     │
                    └─────────────────────────────────────────┘
                           │
               ┌───────────▼───────────────┐
               │   External Integrations   │
               └───────────────────────────┘
               │ DITA-OT (child_process)   │
               │ TypesXML (DTD validation) │
               │ salve-annos (RNG valid.)  │
               │ fast-xml-parser (XML)     │
               │ @xmldom/xmldom (SAX/DOM)  │
               └───────────────────────────┘
```

### Layer Descriptions

| Layer | Purpose | Communication |
|-------|---------|---------------|
| **Commands** | User-triggered actions (menu items, keyboard shortcuts) | Calls Providers and Utils |
| **Providers** | VS Code API integrations (diagnostics, views, webviews) | Uses Utils, responds to VS Code events |
| **Utils** | Shared business logic and utilities | Called by Commands and Providers |
| **LSP Server** | Language intelligence (validation, completions, navigation) | IPC via JSON-RPC |
| **External** | Third-party tools and libraries | Called by Utils and LSP Server |

---

## Component Responsibilities

### Commands (`src/commands/`)

| File | Responsibility |
|------|----------------|
| `validateCommand.ts` | Manual validation trigger; stale diagnostics cleanup on save |
| `publishCommand.ts` | DITA-OT publishing to HTML5, PDF, etc. |
| `previewCommand.ts` | Live HTML preview in VS Code panel |
| `fileCreationCommands.ts` | New DITA file creation from templates |
| `configureCommand.ts` | Extension configuration UI |
| `cspellSetupCommand.ts` | cSpell DITA dictionary setup |

### Providers (`src/providers/`)

| File | Responsibility |
|------|----------------|
| `ditaValidator.ts` | Orchestrates client-side validation engines, manages 'dita' diagnostics |
| `ditaLinkProvider.ts` | Ctrl+Click navigation for href/keyref attributes |
| `keyDiagnostics.ts` | Warnings for missing key references |
| `previewPanel.ts` | WebView-based live HTML preview |
| `mapVisualizerPanel.ts` | Visual map hierarchy display |
| `ditaExplorerProvider.ts` | Activity bar: DITA map tree view |
| `keySpaceViewProvider.ts` | Activity bar: key space view (defined/undefined/unused) |
| `diagnosticsViewProvider.ts` | Activity bar: aggregated diagnostics with dedup |
| `ditaFileDecorationProvider.ts` | Error/warning badges on tree items |
| `typesxmlValidator.ts` | TypesXML DTD validation engine |

### Validation Engines (`src/providers/validation/`)

| File | Responsibility |
|------|----------------|
| `validationTypes.ts` | Shared types (ValidationError, ValidationResult) |
| `validationEngineBase.ts` | IValidationEngine interface |
| `typesxmlEngine.ts` | TypesXML-based DTD validation |
| `builtinEngine.ts` | fast-xml-parser + xmldom validation |
| `xmllintEngine.ts` | External xmllint tool integration |
| `ditaStructureValidator.ts` | Client-side DITA structural rules |
| `diagnosticsManager.ts` | VS Code diagnostics collection management |

### LSP Server (`server/src/`)

| File | Responsibility |
|------|----------------|
| `server.ts` | Entry point: IPC connection, handler wiring, smart debouncing |
| `settings.ts` | Per-document configuration caching |
| `features/validation.ts` | XML well-formedness + DITA structure + ID validation (Layer 1+4) |
| `features/completion.ts` | Element, attribute, value, keyref, href completions |
| `features/hover.ts` | Element docs, key metadata, href/conref preview |
| `features/codeActions.ts` | 9 quick fixes for diagnostics |
| `features/crossRefValidation.ts` | Cross-file reference validation (Layer 6a) |
| `features/ditaRulesValidator.ts` | 35 Schematron-equivalent DITA rules (Layer 5) |
| `features/profilingValidation.ts` | Subject scheme profiling validation (Layer 6b) |
| `services/catalogValidationService.ts` | TypesXML DTD + OASIS catalog (Layer 2) |
| `services/rngValidationService.ts` | salve-annos RelaxNG validation (Layer 3) |
| `services/keySpaceService.ts` | DITA key space resolution (BFS map traversal) |
| `services/subjectSchemeService.ts` | Subject scheme parsing and value constraints |
| `utils/xmlTokenizer.ts` | Error-tolerant state-machine XML tokenizer |
| `utils/i18n.ts` | Localization with 70 messages in EN+FR |

### Utils (`src/utils/`)

| File | Responsibility |
|------|----------------|
| `configurationManager.ts` | Centralized settings access with caching |
| `keySpaceResolver.ts` | Client-side DITA key reference resolution |
| `ditaOtWrapper.ts` | DITA-OT process management |
| `ditaOtErrorParser.ts` | Parse DITA-OT error output |
| `dtdResolver.ts` | Local DTD file resolution |
| `logger.ts` | Centralized logging to output channel |
| `errorUtils.ts` | Error message extraction, fire-and-forget |
| `rateLimiter.ts` | Rate limiting for DoS protection |
| `mapHierarchyParser.ts` | Shared map hierarchy parser (Explorer + Visualizer) |
| `keyUsageScanner.ts` | Workspace-wide keyref/conkeyref scanner |

---

## Data Flow Diagrams

### LSP Validation Pipeline (Primary — Real-time)

```
User types in .dita file
         │
         ▼
onDidChangeContent (server.ts)
         │
         ▼
Smart debounce (300ms topic / 1000ms map)
Per-document cancellation
         │
         ▼
connection.languages.diagnostics.refresh()
         │
         ▼
Pull diagnostics handler
         │
         ├──► Layer 1+4: validateDITADocument()
         │         ├── XML well-formedness (fast-xml-parser)
         │         ├── DITA structure (root, DOCTYPE, title)
         │         ├── Bookmap validation (booktitle, mainbooktitle)
         │         ├── Map/Bookmap topicref check (missing target attrs)
         │         └── ID validation (duplicates, format, single/double quotes)
         │
         ├──► Layer 2: catalogValidationService.validate()
         │         └── DTD validation (TypesXML + OASIS catalog)
         │
         ├──► Layer 3: rngValidationService.validate() [optional]
         │         └── RelaxNG schema validation (salve-annos)
         │
         ├──► Layer 5: validateDitaRules()
         │         └── 35 rules (5 categories, version-filtered)
         │
         ├──► Layer 6a: validateCrossReferences()
         │         └── href/conref/keyref/conkeyref target resolution
         │
         └──► Layer 6b: validateProfilingAttributes()
                   └── Subject scheme controlled values
                            │
                            ▼
                   Diagnostic[] (capped at maxNumberOfProblems)
                            │
                            ▼
                   VS Code Problems Panel ('dita-lsp' source)
```

### Client-Side Validation (Manual — On Demand)

```
User presses Ctrl+Shift+V
         │
         ▼
validateCommand.ts
         │
         ▼
DitaValidator.validateFile()
         │
         ├──► Choose engine (config: typesxml/built-in/xmllint)
         │         ├──► TypesxmlEngine (full DTD)
         │         ├──► BuiltinEngine (XML + basic DTD)
         │         └──► XmllintEngine (external)
         │
         └──► DitaStructureValidator.validate()
                  │
                  ▼
         DiagnosticsManager.update() ('dita' source)
                  │
                  ▼
         Problems Panel + status bar summary
```

### Deduplication Flow

```
On file save:
  └─► validateCommand.ts clears stale 'dita' diagnostics
        (so they don't persist alongside fresh 'dita-lsp' diagnostics)

DiagnosticsViewProvider._collectDitaDiagnostics():
  └─► Deduplicates by composite key: file:line:col:severity:message
        (filters identical diagnostics from different sources)
```

### Key Resolution Flow

```
User requests key resolution (hover/click on keyref)
         │
         ▼
KeySpaceService.resolveKey(keyName, contextFile)
         │
         ├──► findRootMap(contextFile)
         │         └──► Explicit rootMap setting, or search up for .ditamap/.bookmap
         │
         └──► buildKeySpace(rootMapPath)
                  │
                  ├──► Check cache (TTL-based, default 5 min)
                  ├──► [cache miss] BFS traversal of map hierarchy
                  │         ├──► Extract key definitions (first-wins precedence)
                  │         ├──► Follow mapref/topicref to submaps
                  │         └──► Detect subject scheme maps
                  └──► Return KeyDefinition or null
```

### Preview Generation Flow

```
User opens preview (Ctrl+Shift+P)
         │
         ▼
previewCommand.ts
         │
         ├──► Validate input file
         └──► DitaOtWrapper.runDitaOt('html5')
                  │
                  ├──► Spawn DITA-OT process
                  ├──► Stream stdout/stderr
                  └──► On complete: PreviewPanel.createOrShow()
                           └──► Load HTML into WebView
```

---

## Extension Lifecycle

### Activation

```typescript
// extension.ts - activate()
1.  Initialize logger
2.  Initialize configuration manager
3.  Create DitaOtWrapper
4.  Register commands (validate, publish, preview, setRootMap, etc.)
5.  Initialize DitaValidator with context
6.  Register link provider for DITA documents
7.  Register key diagnostics provider
8.  Start LSP client (launches server process)
9.  Register Activity Bar views (Explorer, Key Space, Diagnostics)
10. Register file decoration provider
11. Register openFile command for tree views
12. Check cSpell auto-prompt (disabled by default)
13. Show welcome message (first install)
```

### Deactivation

```typescript
// extension.ts - deactivate()
1. Stop LSP client (server process terminates)
2. Dispose all registered providers
3. Clear all caches
4. Stop any running DITA-OT processes
5. Dispose file watchers
6. Dispose logger
```

---

## Caching Strategies

### Key Space Cache (Server-Side)

| Property | Value |
|----------|-------|
| Location | `KeySpaceService.keySpaceCache` |
| Key | Absolute path to root map |
| TTL | Configurable (default 5 minutes) |
| Max Size | 10 entries |
| Eviction | LRU + TTL-based |
| Invalidation | File watcher on .ditamap/.bookmap changes (debounced 300ms) |

### Subject Scheme Cache (Server-Side)

| Property | Value |
|----------|-------|
| Location | `SubjectSchemeService` |
| Key | Scheme file path |
| TTL | Per-file with invalidation |
| Invalidation | File watcher events |

### RNG Grammar Cache (Server-Side)

| Property | Value |
|----------|-------|
| Location | `RngValidationService` |
| Max Size | 20 compiled grammars |
| Eviction | Oldest-first |

### DTD Parser Pool (Server-Side)

| Property | Value |
|----------|-------|
| Location | `CatalogValidationService` |
| Pool Size | 3 pre-configured parser instances |
| Strategy | Pop/push; create new if pool empty; discard on error |

### Configuration Cache (Client-Side)

| Property | Value |
|----------|-------|
| Location | `ConfigurationManager` |
| TTL | Until configuration change event |
| Invalidation | `onDidChangeConfiguration` listener |

---

## Design Patterns

### Implemented Patterns

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Client-Server** | Extension ↔ LSP Server | Separate processes for UI and language intelligence |
| **Singleton** | `ConfigurationManager`, `Logger` | Single instance for global state |
| **Observer** | `configManager.onConfigurationChange()` | React to config changes |
| **Strategy** | Validation engine selection | Swap validation algorithms |
| **Factory** | `ProviderFactory` | Centralized provider creation |
| **Adapter** | `DitaOtWrapper` | Adapt CLI to TypeScript API |
| **Object Pool** | DTD parser pool, RNG grammar cache | Reuse expensive resources |
| **Pipeline** | 6-layer validation | Sequential processing stages |

---

## Security Considerations

### XXE Protection

External entity declarations are neutralized before parsing:

```typescript
private neutralizeXXE(xmlContent: string): { content: string; hadEntities: boolean } {
    const entityPattern = /<!ENTITY\s+\S+\s+(?:SYSTEM|PUBLIC)\s+[^>]+>/gi;
    // Remove external entities to prevent XXE attacks
}
```

### Path Traversal Prevention

All resolved paths are validated against workspace boundaries:

```typescript
private isPathWithinWorkspace(absolutePath: string): boolean {
    return normalizedPath.startsWith(normalizedWorkspace + path.sep);
}
```

### Command Injection Prevention

External tools are called using `execFile` (not `exec`) with argument arrays:

```typescript
await execFileAsync('xmllint', ['--noout', filePath]);
```

### Rate Limiting

Protection against DoS via rapid validation requests:

```typescript
const rateLimiter = createRateLimiter('VALIDATION');
if (!rateLimiter.isAllowed(filePath)) {
    return; // Skip if rate limited
}
```

---

## File Structure

```
ditacraft/
├── src/                           # Client-side (Extension Host)
│   ├── commands/                  # User-triggered actions
│   │   ├── validateCommand.ts     #   Manual validation + stale cleanup
│   │   ├── publishCommand.ts
│   │   ├── previewCommand.ts
│   │   ├── cspellSetupCommand.ts
│   │   └── ...
│   ├── providers/                 # VS Code API integrations
│   │   ├── ditaValidator.ts       #   Client-side validation orchestrator
│   │   ├── ditaLinkProvider.ts    #   Ctrl+Click navigation
│   │   ├── ditaExplorerProvider.ts#   Activity bar: map tree
│   │   ├── keySpaceViewProvider.ts#   Activity bar: key space
│   │   ├── diagnosticsViewProvider.ts # Activity bar: diagnostics (dedup)
│   │   ├── validation/            #   Modular validation engines
│   │   │   ├── typesxmlEngine.ts
│   │   │   ├── builtinEngine.ts
│   │   │   └── ...
│   │   └── ...
│   ├── utils/                     # Shared client utilities
│   │   ├── configurationManager.ts
│   │   ├── keySpaceResolver.ts
│   │   ├── rateLimiter.ts
│   │   ├── mapHierarchyParser.ts
│   │   └── ...
│   ├── test/                      # Client tests (652)
│   └── extension.ts               # Entry point
│
├── server/                        # LSP Server (Separate Process)
│   ├── src/
│   │   ├── server.ts              # LSP entry point + smart debouncing
│   │   ├── settings.ts
│   │   ├── features/              # 14 LSP feature handlers
│   │   │   ├── validation.ts      #   Layer 1+4: XML + structure + IDs
│   │   │   ├── crossRefValidation.ts # Layer 6a: cross-references
│   │   │   ├── ditaRulesValidator.ts # Layer 5: 35 DITA rules
│   │   │   ├── profilingValidation.ts# Layer 6b: profiling
│   │   │   ├── completion.ts
│   │   │   ├── hover.ts
│   │   │   ├── codeActions.ts
│   │   │   └── ...
│   │   ├── services/              # Domain services with caching
│   │   │   ├── catalogValidationService.ts # Layer 2: DTD
│   │   │   ├── rngValidationService.ts     # Layer 3: RNG
│   │   │   ├── keySpaceService.ts
│   │   │   └── subjectSchemeService.ts
│   │   ├── utils/                 # Server utilities
│   │   │   ├── xmlTokenizer.ts
│   │   │   ├── i18n.ts
│   │   │   └── ...
│   │   ├── messages/              # Localized diagnostic messages
│   │   │   ├── en.json            #   70 messages (English)
│   │   │   └── fr.json            #   70 messages (French)
│   │   └── data/                  # Static schema data
│   │       ├── ditaSchema.ts
│   │       └── ditaSpecialization.ts
│   └── test/                      # Server tests (430)
│
├── dtds/                          # Bundled DITA 1.3 DTDs + catalog.xml
├── docs/                          # Architecture documentation
└── package.json                   # Extension manifest
```

---

*This document should be updated when significant architectural changes are made.*
