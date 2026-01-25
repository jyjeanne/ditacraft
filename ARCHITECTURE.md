# DitaCraft Architecture

**Technical Architecture Documentation**
*Version: 0.4.2 | Last Updated: January 2025*

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

DitaCraft is a VS Code extension that provides comprehensive support for DITA (Darwin Information Typing Architecture) authoring, including:

- XML/DITA validation with multiple engine support
- Live preview with HTML rendering
- Key reference resolution and navigation
- DITA-OT integration for publishing
- Map visualization

### Technology Stack

| Component | Technology |
|-----------|------------|
| Runtime | VS Code Extension Host (Node.js) |
| Language | TypeScript 5.x |
| XML Parsing | fast-xml-parser, @xmldom/xmldom |
| DTD Validation | TypesXML (bundled) |
| Publishing | DITA-OT (external) |
| Testing | Mocha + VS Code Extension Test API |

---

## Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    VS CODE EXTENSION HOST                        │
│  (Event Bus, File System, Text Editors, Output Channels)         │
└─────────────────────────────┬───────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   ┌────▼─────┐        ┌──────▼──────┐       ┌──────▼──────┐
   │ Commands │        │  Providers  │       │   Utils     │
   └──────────┘        └─────────────┘       └─────────────┘
   │ validate │        │ ditaValidator│      │ ditaOtWrapper│
   │ publish  │        │ linkProvider │      │ keySpaceRes. │
   │ preview  │        │ keyDiagnostic│      │ configManager│
   │ newFile  │        │ previewPanel │      │ logger       │
   │ configure│        │ mapVisualizer│      │ errorUtils   │
   └──────────┘        └─────────────┘       └─────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
               ┌──────────────▼──────────────┐
               │   External Integrations     │
               └─────────────────────────────┘
               │ DITA-OT (child_process)     │
               │ TypesXML (DTD validation)   │
               │ fast-xml-parser (XML)       │
               │ @xmldom/xmldom (SAX/DOM)    │
               └─────────────────────────────┘
```

### Layer Descriptions

| Layer | Purpose | Communication |
|-------|---------|---------------|
| **Commands** | User-triggered actions (menu items, keyboard shortcuts) | Calls Providers and Utils |
| **Providers** | VS Code API integrations (diagnostics, document links, webviews) | Uses Utils, responds to VS Code events |
| **Utils** | Shared business logic and utilities | Called by Commands and Providers |
| **External** | Third-party tools and libraries | Called by Utils |

---

## Component Responsibilities

### Commands (`src/commands/`)

| File | Responsibility |
|------|----------------|
| `validateCommand.ts` | Manual validation trigger, auto-validation on save |
| `publishCommand.ts` | DITA-OT publishing to HTML5, PDF, etc. |
| `previewCommand.ts` | Live HTML preview in VS Code panel |
| `fileCreationCommands.ts` | New DITA file creation from templates |
| `configureCommand.ts` | Extension configuration UI |

### Providers (`src/providers/`)

| File | Responsibility |
|------|----------------|
| `ditaValidator.ts` | Orchestrates validation engines, manages diagnostics |
| `ditaLinkProvider.ts` | Ctrl+Click navigation for href/keyref attributes |
| `keyDiagnostics.ts` | Warnings for missing key references |
| `previewPanel.ts` | WebView-based live HTML preview |
| `mapVisualizerPanel.ts` | Visual map hierarchy display |
| `typesxmlValidator.ts` | TypesXML DTD validation engine |
| `ditaContentModelValidator.ts` | DITA content model validation |

### Validation Engines (`src/providers/validation/`)

| File | Responsibility |
|------|----------------|
| `validationTypes.ts` | Shared types (ValidationError, ValidationResult) |
| `validationEngineBase.ts` | IValidationEngine interface |
| `typesxmlEngine.ts` | TypesXML-based DTD validation |
| `builtinEngine.ts` | fast-xml-parser + xmldom validation |
| `xmllintEngine.ts` | External xmllint tool integration |
| `ditaStructureValidator.ts` | DITA-specific structural rules |
| `diagnosticsManager.ts` | VS Code diagnostics collection management |

### Utils (`src/utils/`)

| File | Responsibility |
|------|----------------|
| `configurationManager.ts` | Centralized settings access with caching |
| `keySpaceResolver.ts` | DITA key reference resolution |
| `ditaOtWrapper.ts` | DITA-OT process management |
| `ditaOtErrorParser.ts` | Parse DITA-OT error output |
| `dtdResolver.ts` | Local DTD file resolution |
| `logger.ts` | Centralized logging to output channel |
| `errorUtils.ts` | Error message extraction, fire-and-forget |
| `debounceUtils.ts` | Debouncing utilities for events |
| `providerFactory.ts` | Centralized provider creation with DI |
| `rateLimiter.ts` | Rate limiting for DoS protection |
| `constants.ts` | Global constants and configuration |

---

## Data Flow Diagrams

### Validation Pipeline

```
User Action (save/Ctrl+Shift+V)
         │
         ▼
validateCommand.ts (debounced 500ms)
         │
         ▼
DitaValidator.validateFile()
         │
         ├──► Choose engine (config: typesxml/built-in/xmllint)
         │         │
         │         ├──► TypesxmlEngine (full DTD)
         │         ├──► BuiltinEngine (XML + basic DTD)
         │         └──► XmllintEngine (external)
         │
         ├──► DitaStructureValidator.validate()
         │
         └──► validateDitaContentModel() [if not TypesXML]
                  │
                  ▼
         DiagnosticsManager.update()
                  │
                  ▼
         Problems Panel displays errors/warnings
```

### Key Resolution Flow

```
User requests key resolution (hover/click on keyref)
         │
         ▼
KeySpaceResolver.resolveKey(keyName, contextFile)
         │
         ├──► findRootMap(contextFile)
         │         │
         │         └──► Search up directory tree for .ditamap/.bookmap
         │
         └──► buildKeySpace(rootMapPath)
                  │
                  ├──► Check cache (TTL-based)
                  │
                  ├──► [cache miss] BFS traversal of map hierarchy
                  │         │
                  │         ├──► Extract key definitions (first-wins precedence)
                  │         └──► Follow mapref/topicref to submaps
                  │
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
         │
         └──► DitaOtWrapper.runDitaOt('html5')
                  │
                  ├──► Spawn DITA-OT process
                  │
                  ├──► Stream stdout/stderr
                  │
                  └──► On complete: PreviewPanel.createOrShow()
                           │
                           └──► Load HTML into WebView
```

---

## Extension Lifecycle

### Activation

```typescript
// extension.ts - activate()
1. Initialize logger
2. Initialize configuration manager
3. Create DitaOtWrapper
4. Register commands (validate, publish, preview, etc.)
5. Initialize DitaValidator with context
6. Register link provider for DITA documents
7. Register key diagnostics provider
8. Set up file watchers for auto-validation
```

### Deactivation

```typescript
// extension.ts - deactivate()
1. Dispose all registered providers
2. Clear all caches
3. Stop any running DITA-OT processes
4. Dispose file watchers
5. Dispose logger
```

### Disposable Pattern

All components implement `vscode.Disposable`:

```typescript
class MyProvider implements vscode.Disposable {
    private disposables: vscode.Disposable[] = [];

    constructor() {
        // Register listeners
        this.disposables.push(
            vscode.workspace.onDidChangeConfiguration(/* ... */),
            vscode.workspace.onDidSaveTextDocument(/* ... */)
        );
    }

    dispose(): void {
        this.disposables.forEach(d => d.dispose());
    }
}
```

---

## Caching Strategies

### Key Space Cache

| Property | Value |
|----------|-------|
| Location | `KeySpaceResolver.keySpaceCache` |
| Key | Absolute path to root map |
| TTL | Configurable (default 5 minutes) |
| Max Size | 10 entries |
| Eviction | LRU + TTL-based |
| Invalidation | File watcher on .ditamap/.bookmap changes |

```typescript
interface KeySpace {
    rootMap: string;
    keys: Map<string, KeyDefinition>;
    buildTime: number;
    mapHierarchy: string[];
}
```

### Root Map Cache

| Property | Value |
|----------|-------|
| Location | `KeySpaceResolver.rootMapCache` |
| Key | Directory path |
| TTL | 1 minute |
| Purpose | Avoid repeated directory scans |

### Configuration Cache

| Property | Value |
|----------|-------|
| Location | `ConfigurationManager` |
| TTL | Until configuration change event |
| Invalidation | `onDidChangeConfiguration` listener |

### Adaptive Cleanup

Cache cleanup runs periodically but skips when caches are empty:

```typescript
if (this.keySpaceCache.size === 0 && this.rootMapCache.size === 0) {
    return; // Skip cleanup when empty
}
```

---

## Design Patterns

### Implemented Patterns

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Singleton** | `ConfigurationManager`, `Logger` | Single instance for global state |
| **Observer** | `configManager.onConfigurationChange()` | React to config changes |
| **Strategy** | Validation engine selection | Swap validation algorithms |
| **Factory** | `ProviderFactory` | Centralized provider creation |
| **Adapter** | `DitaOtWrapper` | Adapt CLI to TypeScript API |
| **Facade** | `configManager` proxy | Simplify configuration access |

### Factory Pattern Example

```typescript
// providerFactory.ts
class ProviderFactory {
    getValidator(): DitaValidator {
        if (!this.validator) {
            this.validator = new DitaValidator(this.context);
            this.disposables.push(this.validator);
        }
        return this.validator;
    }

    getKeySpaceResolver(): KeySpaceResolver {
        // Shared instance for dependency injection
    }
}
```

### Strategy Pattern Example

```typescript
// ditaValidator.ts
private getActiveEngine(): IValidationEngine | null {
    switch (this.currentEngine) {
        case 'typesxml': return this.typesxmlEngine;
        case 'xmllint': return this.xmllintEngine;
        case 'built-in': return this.builtinEngine;
    }
}
```

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
    // Only allow paths INSIDE workspace folders, not equal to root
    return normalizedPath.startsWith(normalizedWorkspace + path.sep);
}
```

### Command Injection Prevention

External tools are called using `execFile` (not `exec`) with argument arrays:

```typescript
// Safe: arguments passed as array
await execFileAsync('xmllint', ['--noout', filePath]);

// Unsafe (not used): shell string interpolation
// exec(`xmllint --noout ${filePath}`);  // NEVER DO THIS
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
src/
├── commands/           # User-triggered actions
│   ├── validateCommand.ts
│   ├── publishCommand.ts
│   ├── previewCommand.ts
│   └── ...
├── providers/          # VS Code API integrations
│   ├── ditaValidator.ts
│   ├── ditaLinkProvider.ts
│   ├── validation/     # Modular validation engines
│   │   ├── index.ts
│   │   ├── typesxmlEngine.ts
│   │   ├── builtinEngine.ts
│   │   └── ...
│   └── ...
├── utils/              # Shared utilities
│   ├── configurationManager.ts
│   ├── keySpaceResolver.ts
│   ├── providerFactory.ts
│   └── ...
├── test/               # Test suites
│   └── suite/
│       ├── ditaValidator.test.ts
│       └── ...
└── extension.ts        # Entry point
```

---

*This document should be updated when significant architectural changes are made.*
