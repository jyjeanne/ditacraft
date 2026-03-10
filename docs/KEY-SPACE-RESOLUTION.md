# Key Space Resolution — Implemented Specification

**Version:** 2.0 (Implemented)
**Status:** Fully implemented in v0.6.2
**Last Updated:** March 2026

---

## Overview

DitaCraft implements full DITA key space resolution across both the VS Code client and the LSP server. Key spaces are built from DITA map hierarchies and support navigation, validation, completion, and hover for `@keyref`, `@conkeyref`, `@keys`, and related attributes.

---

## DITA Key Space Concepts

### What is a Key Space?

A key space is a table mapping key names to their definitions. In DITA:

1. **Keys are defined in maps** using `<keydef>` or any element with `@keys` attribute
2. **Keys inherit through map hierarchy** (root map → submaps, BFS order)
3. **First definition wins** (key precedence)
4. **Keys can have scope** (`@keyscope`) and conditional processing
5. **Keys can reference files, elements, or define inline content**

### Example Key Definition

```xml
<!-- In root.ditamap -->
<map>
  <keydef keys="product-name" href="topics/product-name.dita"/>
  <keydef keys="maintenance-version">
    <topicmeta><keywords><keyword>4.3.2</keyword></keywords></topicmeta>
  </keydef>
  <mapref href="conref-library.ditamap"/>
</map>

<!-- In conref-library.ditamap -->
<map>
  <keydef keys="conref-task" href="library/conref-task.dita"/>
</map>
```

### Key Space Table Result

| Key Name | Target File | Element ID | Inline Content | Source Map |
|----------|-------------|------------|----------------|------------|
| `product-name` | `topics/product-name.dita` | — | — | root.ditamap |
| `maintenance-version` | — | — | `4.3.2` | root.ditamap |
| `conref-task` | `library/conref-task.dita` | — | — | conref-library.ditamap |

---

## Architecture

### Dual Implementation

Key space resolution is implemented in two layers:

```
┌─────────────────────────────────────────────────────────┐
│                   VS Code Client                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ DitaLink     │  │ KeyDiag      │  │ KeySpaceView  │  │
│  │ Provider     │  │ Provider     │  │ Provider      │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  │
│         └─────────────────┼──────────────────┘           │
│                    ┌──────┴───────┐                       │
│                    │ KeySpace     │                       │
│                    │ Resolver     │  ← Client-side        │
│                    └──────────────┘                       │
├──────────────────────── IPC ─────────────────────────────┤
│                    LSP Server                             │
│  ┌──────────┐ ┌───────┐ ┌──────────┐ ┌──────────────┐   │
│  │Completion│ │ Hover │ │Definition│ │ CrossRef     │   │
│  │          │ │       │ │          │ │ Validation   │   │
│  └────┬─────┘ └───┬───┘ └────┬─────┘ └──────┬───────┘   │
│       └───────────┼──────────┼───────────────┘           │
│             ┌─────┴──────────┴─────┐                     │
│             │  KeySpaceService     │  ← Server-side      │
│             └──────────────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

Both implementations share the same BFS algorithm, caching strategy, and data structures but serve different consumers.

---

## Core Data Structures

```typescript
interface KeyDefinition {
    keyName: string;
    targetFile?: string;           // Resolved absolute path
    elementId?: string;            // For conref targets (after #)
    inlineContent?: string;        // For inline key definitions
    sourceMap: string;             // Where the key was defined
    scope?: string;                // local, peer, external
    processingRole?: string;       // resource-only, normal
    metadata?: KeyMetadata;
}

interface KeyMetadata {
    navtitle?: string;
    keywords?: string[];
    shortdesc?: string;
}

interface KeySpace {
    rootMap: string;                    // Root map absolute path
    keys: Map<string, KeyDefinition>;   // Key name → definition
    buildTime: number;                  // Epoch ms when built
    mapHierarchy: string[];             // All maps traversed (BFS order)
    subjectSchemePaths?: string[];      // Subject scheme maps (server only)
}
```

---

## Client: KeySpaceResolver

**File:** `src/utils/keySpaceResolver.ts`

### API

```typescript
class KeySpaceResolver implements Disposable {
    async buildKeySpace(rootMapPath: string): Promise<KeySpace>
    async resolveKey(keyName: string, contextFilePath: string): Promise<KeyDefinition | null>
    async findRootMap(filePath: string): Promise<string | null>
    getCacheStats(): CacheStats
    clearCache(): void
    reloadCacheConfig(): void
    dispose(): void
}
```

### Key Space Building Algorithm

Uses **Breadth-First Search** to traverse the map hierarchy:

```
Input: rootMapPath
Output: KeySpace with all keys from hierarchy

1. Initialize queue = [rootMapPath], visited = {}, keys = {}
2. While queue is not empty:
   a. Dequeue currentMap
   b. Skip if already visited (circular reference protection)
   c. Mark as visited, add to mapHierarchy
   d. Parse currentMap for elements with @keys attribute
   e. For each key definition:
      - If key NOT already in keys → add it (first definition wins)
      - Resolve @href relative to map directory
      - Extract elementId from fragment (#)
      - Extract inline content from <topicmeta>
      - Capture scope, processingRole, metadata
   f. Find submap references (<mapref>, <topicref> with .ditamap href)
   g. Enqueue submaps
3. Return KeySpace
```

### Root Map Discovery

Priority order for auto-detection:
1. `root.ditamap`
2. `main.ditamap`
3. `master.ditamap`
4. First `.ditamap` file alphabetically

### Caching Strategy

| Parameter | Value | Notes |
|-----------|-------|-------|
| TTL | 5 minutes (configurable) | `keySpaceCacheTtlMinutes` setting |
| Max cache size | 10 root maps | LRU eviction when full |
| Cleanup interval | `max(5min, TTL/3)` | Adaptive, only runs if entries exist |
| Root map cache | 1 minute TTL | Separate cache for directory lookups |
| In-flight dedup | `pendingBuilds` Map | Concurrent requests share one build |

### Client Consumers

| Consumer | Usage |
|----------|-------|
| **DitaLinkProvider** | Click-to-navigate for `@keyref`, `@conkeyref` |
| **KeyDiagnosticsProvider** | Warns on undefined key references (1s debounce) |
| **KeySpaceViewProvider** | Activity Bar tree: Defined & Used / Undefined / Unused keys |

---

## Server: KeySpaceService

**File:** `server/src/services/keySpaceService.ts`

### API

```typescript
class KeySpaceService {
    async resolveKey(keyName: string, contextFilePath: string): Promise<KeyDefinition | null>
    async getAllKeys(contextFilePath: string): Promise<Map<string, KeyDefinition>>
    async getSubjectSchemePaths(contextFilePath: string): Promise<string[]>
    async buildKeySpace(rootMapPath: string): Promise<KeySpace>
    async findRootMap(filePath: string): Promise<string | null>
    setExplicitRootMap(rootMapPath: string | null): void
    getExplicitRootMap(): string | null
    invalidateForFile(changedFile: string): void
    updateWorkspaceFolders(added: string[], removed: string[]): void
    async reloadCacheConfig(): Promise<void>
    shutdown(): void
}
```

### Extended Server Features

Beyond the client implementation, the server adds:

- **Key scoping** (`@keyscope`): Tracks scope attributes and creates qualified key names (e.g., `scope.keyname`)
- **Subject scheme detection**: Identifies subject scheme maps and stores paths in `keySpace.subjectSchemePaths`
- **Explicit root map override**: `setExplicitRootMap()` bypasses auto-discovery
- **`getAllKeys()`**: Returns full key space for autocompletion
- **`getSubjectSchemePaths()`**: Used by SubjectSchemeService for profiling validation

### Server Consumers

| Consumer | Usage |
|----------|-------|
| **Completion** | keyref/conkeyref suggestions with metadata, fragment completion |
| **Hover** | Key info: target file, metadata, inline content, source map |
| **Definition** | Go-to-definition for keyref → target file + element |
| **CrossRefValidation** | Validates keys exist and have valid targets |

---

## LSP Feature Integration

### Completion (keyref/conkeyref)

When typing inside a `keyref="..."` or `conkeyref="..."` attribute:
1. Calls `keySpaceService.getAllKeys()` for context file
2. Returns CompletionItems with:
   - Key name as label
   - Target file path as detail (`→ filename.dita`)
   - Metadata (navtitle, shortdesc) in documentation
   - Inline content shown when no target file
3. Fragment completion: Typing `keyname/` triggers element ID suggestions from target file

### Hover

Hovering over a keyref value shows:
- Key name and resolution status
- Target file path (absolute)
- Navtitle, shortdesc, keywords from metadata
- Inline content (if defined)
- Source map where key was defined
- XML preview of conref content

### Definition

`Go to Definition` on keyref navigates to:
- Key's target file at the element ID position (if specified)
- Key's target file at line 0 (if no element ID)
- Source map (fallback if no target file)

### Cross-Reference Validation

| Code | Severity | Description |
|------|----------|-------------|
| `DITA-KEY-001` | Error | Undefined key — not found in any key space |
| `DITA-KEY-002` | Warning | Key has no target file (may be inline-only) |
| `DITA-KEY-003` | Warning | Element ID not found in key's target file |
| `DITA-XREF-001` | Error | Referenced file does not exist |
| `DITA-XREF-002` | Warning | Topic ID not found in target file |
| `DITA-XREF-003` | Warning | Element ID not found within topic |

---

## Security

| Measure | Implementation |
|---------|----------------|
| **Path traversal prevention** | `isPathWithinWorkspace()` validates all resolved paths are strictly inside workspace folders |
| **ReDoS protection** | All regex operations bounded by `maxLinkMatches` (default 10000); submap extraction capped at `maxLinkMatches/10` (min 1000) |
| **Circular reference protection** | `visited` Set prevents re-processing maps in BFS traversal |
| **Comment/CDATA stripping** | Comments replaced with spaces (preserving offsets) before key extraction to prevent false matches |

---

## Performance

| Operation | Complexity | Notes |
|-----------|------------|-------|
| Build key space (cold) | O(M × K) | M = maps, K = keys per map |
| Resolve single key | O(1) | HashMap lookup (after cache hit) |
| Find root map (cached) | O(1) | 1-minute TTL cache |
| Find root map (cold) | O(D) | D = directory scan depth |
| Cache invalidation | O(M) | Worst case: rebuild full space |

### Debouncing

| Trigger | Delay | Notes |
|---------|-------|-------|
| File watcher (map change) | 300ms | Invalidates affected cache entries |
| Key diagnostics check | 1000ms | Per-document, on text change |
| Key space view refresh | 1000ms | After any map file change |

### Memory Estimate (500 keys, 50 maps)

- Key definitions: ~100 KB
- Map hierarchy: ~5 KB
- Cache overhead: ~20 KB
- **Total: ~125–150 KB per workspace**

---

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `ditacraft.keySpaceCacheTtlMinutes` | `5` | Key space cache time-to-live (minimum 1) |
| `ditacraft.maxLinkMatches` | `10000` | Max regex matches for key extraction |

Settings are reloaded dynamically via `reloadCacheConfig()` on configuration change events.

---

## Testing

### Client Tests (`src/test/suite/keySpaceResolver.test.ts`)

- Single map key extraction (href, topicmeta, multiple keys, inline, scope)
- Map hierarchy traversal (BFS order, deep nesting)
- Key precedence (first definition wins across hierarchy)
- Circular reference detection
- Root map discovery priority
- Cache TTL, LRU eviction, statistics, clearing
- Error handling (missing maps, malformed XML, missing submaps)
- Real-world scenarios (product docs, conkeyref resolution)

### Memory Tests (`keySpaceResolverMemory.test.ts`)

- Cache respects maxSize with LRU eviction
- Cache stats accuracy
- clearCache removes all entries

### View Provider Tests (`keySpaceViewProvider.test.ts`)

- Tree item creation for groups, keys, and usages
- Provider initialization and refresh
- Item hierarchy and children retrieval

---

## Implementation History

| Version | Milestone |
|---------|-----------|
| v0.1.3 | Initial specification (this document, original draft) |
| v0.2.0 | Basic `KeySpaceResolver` with BFS, caching, `DitaLinkProvider` integration |
| v0.3.0 | `KeyDiagnosticsProvider`, `KeySpaceViewProvider`, root map auto-detection |
| v0.4.0 | Security hardening (path traversal, ReDoS), in-flight dedup, LRU eviction |
| v0.5.0 | LSP server `KeySpaceService` with key scoping and subject scheme detection |
| v0.6.0 | Cross-reference validation (DITA-KEY-001/002/003), completion, hover, definition |
| v0.6.2 | Refined validation codes, improved error ranges, 1082 total tests |

---

## Original Specification Notes

The original v0.1.3 specification proposed a 6-phase, 11–16 day implementation plan. All phases have been completed:

| Phase | Status |
|-------|--------|
| Phase 1: Basic Key Space Builder | Done (v0.2.0) |
| Phase 2: Map Hierarchy Resolution | Done (v0.2.0) |
| Phase 3: DitaLinkProvider Integration | Done (v0.2.0) |
| Phase 4: Same-File References | Done (v0.3.0) |
| Phase 5: Caching & Performance | Done (v0.4.0) |
| Phase 6: Advanced Features (scoping, metadata) | Done (v0.5.0–v0.6.0) |

### Alternatives Considered (preserved from original spec)

| Approach | Verdict |
|----------|---------|
| Use DITA-OT for key resolution | Rejected — too slow (JVM startup), overkill for navigation |
| Parse on every request | Rejected — not viable without caching |
| Pre-build key space database | Rejected — over-engineered for this use case |
| **Partial key resolution with BFS + caching** | **Chosen** — best fit for VS Code extension constraints |
