# Key Space Resolution Specification

## Overview

This document provides a technical specification for implementing DITA key space resolution in DitaCraft. Key space resolution is essential for supporting proper navigation of `@keyref`, `@conkeyref`, and same-file `@conref` attributes.

## Problem Statement

Current DitaCraft v0.1.3 cannot navigate:
- `<keyword keyref="maintenance-version"/>` - Key references
- `<ph conref="#v4.3/summary"/>` - Same-file content references
- `<p conkeyref="conref-task/semver-info"/>` - Content key references

This is because these reference types require resolving keys through a **key space** built from the DITA map hierarchy.

---

## DITA Key Space Concepts

### What is a Key Space?

A key space is a table mapping key names to their definitions. In DITA:

1. **Keys are defined in maps** using `<keydef>` or `<topicref>` with `@keys` attribute
2. **Keys inherit through map hierarchy** (root map ? submaps)
3. **First definition wins** (key precedence)
4. **Keys can have scope** and conditional processing

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

| Key Name | Target File | Element ID | Source Map |
|----------|-------------|------------|------------|
| `product-name` | `topics/product-name.dita` | - | root.ditamap |
| `maintenance-version` | (inline content) | - | root.ditamap |
| `conref-task` | `library/conref-task.dita` | - | conref-library.ditamap |

---

## Technical Specification

### 1. Architecture

```
+-------------------------------------------------------------+
¦                     DitaCraft Extension                      ¦
+-------------------------------------------------------------¦
¦                                                              ¦
¦  +-------------+    +--------------+    +---------------+  ¦
¦  ¦   Existing  ¦    ¦  NEW: Key    ¦    ¦   Existing    ¦  ¦
¦  ¦ DitaLink    ¦---?¦   Space      ¦?---¦  Workspace    ¦  ¦
¦  ¦  Provider   ¦    ¦   Resolver   ¦    ¦   Watcher     ¦  ¦
¦  +-------------+    +--------------+    +---------------+  ¦
¦                            ¦                                 ¦
¦                            ?                                 ¦
¦                    +--------------+                         ¦
¦                    ¦   Key Space  ¦                         ¦
¦                    ¦    Cache     ¦                         ¦
¦                    +--------------+                         ¦
+-------------------------------------------------------------+
```

### 2. Core Components

#### 2.1 KeySpaceResolver Class

```typescript
interface KeyDefinition {
  keyName: string;
  targetFile?: string;           // Resolved absolute path
  elementId?: string;            // For conref targets
  inlineContent?: string;        // For inline key definitions
  sourceMap: string;             // Where the key was defined
  scope?: string;                // Key scope (local, peer, external)
  processingRole?: string;       // resource-only, etc.
  metadata?: KeyMetadata;        // Additional metadata
}

interface KeyMetadata {
  navtitle?: string;
  keywords?: string[];
  shortdesc?: string;
}

interface KeySpace {
  rootMap: string;                    // Root map path
  keys: Map<string, KeyDefinition>;   // Key name ? definition
  buildTime: number;                  // When the key space was built
  mapHierarchy: string[];             // All maps in hierarchy
}

class KeySpaceResolver {
  private keySpaceCache: Map<string, KeySpace> = new Map();
  private fileWatcher: vscode.FileSystemWatcher;

  // Build key space from root map
  async buildKeySpace(rootMapPath: string): Promise<KeySpace>;

  // Resolve a key name to its definition
  resolveKey(keyName: string, contextFile: string): KeyDefinition | null;

  // Find root map for a given file
  findRootMap(filePath: string): string | null;

  // Invalidate cache when maps change
  invalidateCache(changedFile: string): void;

  // Parse a single map file for key definitions
  private parseMapForKeys(mapPath: string): KeyDefinition[];

  // Recursively process map references
  private processMapHierarchy(mapPath: string, visited: Set<string>): void;
}
```

#### 2.2 Key Space Builder Algorithm

```typescript
async buildKeySpace(rootMapPath: string): Promise<KeySpace> {
  const keySpace: KeySpace = {
    rootMap: rootMapPath,
    keys: new Map(),
    buildTime: Date.now(),
    mapHierarchy: []
  };

  const visited = new Set<string>();
  const queue: string[] = [rootMapPath];

  // Breadth-first traversal of map hierarchy
  while (queue.length > 0) {
    const currentMap = queue.shift()!;

    if (visited.has(currentMap)) continue;
    visited.add(currentMap);
    keySpace.mapHierarchy.push(currentMap);

    // Parse current map
    const mapContent = await this.readFile(currentMap);
    const keys = this.extractKeyDefinitions(mapContent, currentMap);

    // First definition wins (key precedence)
    for (const keyDef of keys) {
      if (!keySpace.keys.has(keyDef.keyName)) {
        keySpace.keys.set(keyDef.keyName, keyDef);
      }
    }

    // Find and queue submaps
    const submaps = this.extractMapReferences(mapContent, currentMap);
    queue.push(...submaps);
  }

  return keySpace;
}
```

#### 2.3 Integration with DitaLinkProvider

```typescript
// Enhanced processKeyrefAttributes
private async processKeyrefAttributes(
  text: string,
  document: vscode.TextDocument,
  documentDir: string,
  links: vscode.DocumentLink[]
): Promise<void> {
  const keyrefRegex = /\bkeyref\s*=\s*["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;

  while ((match = keyrefRegex.exec(text)) !== null) {
    const keyrefValue = match[1];

    // NEW: Resolve key through key space
    const keyDefinition = await this.keySpaceResolver.resolveKey(
      keyrefValue,
      document.uri.fsPath
    );

    if (keyDefinition && keyDefinition.targetFile) {
      const range = this.calculateRange(match, text, document);
      const targetUri = vscode.Uri.file(keyDefinition.targetFile);

      // If element ID exists, add fragment
      if (keyDefinition.elementId) {
        // Navigate to specific element (requires additional work)
      }

      const link = new vscode.DocumentLink(range, targetUri);
      link.tooltip = `Open key reference: ${keyrefValue}`;
      links.push(link);
    }
  }
}
```

### 3. Same-File Reference Resolution

```typescript
private processSameFileConref(
  conrefValue: string,  // e.g., "#v4.3/summary"
  document: vscode.TextDocument,
  links: vscode.DocumentLink[]
): void {
  // Extract element path after #
  const elementPath = conrefValue.substring(1); // "v4.3/summary"

  // Create link to current file with fragment
  const targetUri = document.uri.with({
    fragment: elementPath  // VS Code handles fragment navigation
  });

  // Create document link
  const link = new vscode.DocumentLink(range, targetUri);
  link.tooltip = `Go to element: ${elementPath}`;
  links.push(link);
}
```

### 4. Performance Considerations

#### 4.1 Caching Strategy

```typescript
interface CacheStrategy {
  // Cache key spaces per root map
  keySpaceTTL: number;            // Time-to-live in milliseconds
  maxCacheSize: number;           // Max number of cached key spaces
  invalidationPolicy: 'lazy' | 'eager';

  // Lazy: Invalidate on next access
  // Eager: Invalidate immediately on file change
}

const defaultCacheConfig: CacheStrategy = {
  keySpaceTTL: 5 * 60 * 1000,     // 5 minutes
  maxCacheSize: 10,                // 10 root maps
  invalidationPolicy: 'lazy'
};
```

#### 4.2 Incremental Updates

Instead of rebuilding entire key space:
1. Track which map files have changed
2. Only re-parse changed maps
3. Update affected keys in the key space
4. Propagate changes to dependent maps

---

## Complexity Analysis

### Time Complexity

| Operation | Complexity | Notes |
|-----------|-----------|-------|
| Build Key Space (cold) | O(M × K) | M = maps, K = keys per map |
| Resolve Single Key | O(1) | Hash map lookup |
| Find Root Map | O(D) | D = directory depth |
| Cache Invalidation | O(M) | Worst case: rebuild entire space |
| Link Provider (per file) | O(R × log K) | R = refs in file, K = keys |

### Space Complexity

| Component | Memory Usage | Notes |
|-----------|-------------|-------|
| Key Space Cache | O(K × M) | K keys × M maps |
| Map Hierarchy | O(M) | List of map paths |
| File Watchers | O(W) | W watched directories |
| Parse Buffers | O(F) | F = file size being parsed |

### Estimated Memory for Large Projects

For a DITA-OT docs-sized project (~500 keys, 50 maps):
- Key definitions: ~500 × 200 bytes = 100 KB
- Map hierarchy: 50 × 100 bytes = 5 KB
- Cache overhead: ~20 KB
- **Total: ~125-150 KB per workspace**

---

## Implementation Phases

### Phase 1: Basic Key Space Builder (2-3 days)
**Complexity: Medium**

1. Parse map files for `<keydef>` elements
2. Build flat key space (no scoping)
3. Handle simple `@keys` and `@href` attributes
4. Cache key space per root map

**Deliverables:**
- `KeySpaceResolver` class with basic parsing
- Unit tests for key extraction
- Integration with workspace

### Phase 2: Map Hierarchy Resolution (2-3 days)
**Complexity: Medium-High**

1. Parse `<mapref>`, `<topicgroup>` with map references
2. Implement breadth-first map traversal
3. Handle circular reference detection
4. Respect key precedence (first definition wins)

**Deliverables:**
- Recursive map parsing
- Circular reference protection
- Key precedence logic

### Phase 3: DitaLinkProvider Integration (1-2 days)
**Complexity: Medium**

1. Modify `processKeyrefAttributes()` to use key space
2. Modify `processConkeyrefAttributes()` similarly
3. Add async/await support to link provider
4. Handle inline key definitions

**Deliverables:**
- Working `@keyref` navigation
- Working `@conkeyref` navigation
- Tooltip showing key definition source

### Phase 4: Same-File References (1 day)
**Complexity: Low**

1. Handle `@conref="#element/path"` references
2. Create fragment-based URI navigation
3. Support element ID lookup within file

**Deliverables:**
- Same-file `@conref` navigation
- Element ID fragment support

### Phase 5: Caching & Performance (2-3 days)
**Complexity: Medium-High**

1. Implement file system watchers for maps
2. Add cache invalidation logic
3. Implement lazy vs eager invalidation
4. Add cache statistics/monitoring

**Deliverables:**
- File watcher integration
- Cache invalidation
- Performance metrics

### Phase 6: Advanced Features (3-4 days)
**Complexity: High**

1. Key scoping (`@keyscope`)
2. Conditional key definitions (`@props`)
3. Key metadata extraction (navtitle, keywords)
4. Root map auto-detection

**Deliverables:**
- Scoped key resolution
- Conditional processing support
- Metadata in tooltips

---

## Total Estimated Effort

| Phase | Time | Complexity |
|-------|------|------------|
| Phase 1: Basic Key Space | 2-3 days | Medium |
| Phase 2: Map Hierarchy | 2-3 days | Medium-High |
| Phase 3: Link Provider Integration | 1-2 days | Medium |
| Phase 4: Same-File References | 1 day | Low |
| Phase 5: Caching & Performance | 2-3 days | Medium-High |
| Phase 6: Advanced Features | 3-4 days | High |
| **Total** | **11-16 days** | **Medium-High** |

---

## Risk Assessment

### High Risk
1. **Performance with large maps** - Parsing 100+ maps could be slow
   - Mitigation: Incremental parsing, aggressive caching

2. **Complex map hierarchies** - Nested submaps, indirect references
   - Mitigation: Thorough testing with real-world projects (DITA-OT docs)

3. **Memory consumption** - Large key spaces in memory
   - Mitigation: LRU cache eviction, lazy loading

### Medium Risk
1. **Key scoping edge cases** - Complex scoping rules in DITA 1.3
   - Mitigation: Start without scoping, add incrementally

2. **Circular references** - Maps referencing each other
   - Mitigation: Visited set tracking (already in spec)

3. **File system race conditions** - Maps changing during parsing
   - Mitigation: Lock mechanism or optimistic concurrency

### Low Risk
1. **XML parsing errors** - Malformed maps
   - Mitigation: Graceful error handling, partial key space

2. **Cross-platform paths** - Windows vs Unix paths
   - Mitigation: Use Node.js `path` module consistently

---

## Testing Strategy

### Unit Tests
1. Key extraction from single map
2. Key precedence (first wins)
3. Map hierarchy traversal
4. Circular reference detection
5. Cache invalidation

### Integration Tests
1. End-to-end key resolution
2. Link provider with key space
3. Real DITA-OT docs project
4. Performance benchmarks

### Test Data Sets
1. Simple: 1 map, 10 keys
2. Medium: 10 maps, 100 keys
3. Large: 50+ maps, 500+ keys (DITA-OT docs)
4. Edge cases: circular refs, deep nesting, scopes

---

## Alternatives Considered

### 1. Use DITA-OT for Key Resolution
**Pros:** Already implemented, accurate
**Cons:** Slow (JVM startup), requires DITA-OT installed, overkill for navigation
**Verdict:** Not suitable for real-time navigation

### 2. Parse on Every Request
**Pros:** Always up-to-date
**Cons:** Too slow for large projects
**Verdict:** Not viable without caching

### 3. Pre-build Key Space Database
**Pros:** Very fast lookups
**Cons:** Complex synchronization, external dependency
**Verdict:** Over-engineered for this use case

### 4. Partial Key Resolution (Current Choice)
**Pros:** Balance of performance and accuracy
**Cons:** May miss edge cases
**Verdict:** Best fit for VS Code extension constraints

---

## Success Criteria

1. **Functional:** Navigate to 95%+ of key references in DITA-OT docs project
2. **Performance:** Key space build < 2 seconds for 50 maps
3. **Memory:** < 200KB per workspace
4. **UX:** Link underline appears within 100ms of file open
5. **Reliability:** No crashes on malformed maps, graceful degradation

---

## Conclusion

Implementing proper key space resolution is a **medium-high complexity** feature requiring approximately **11-16 days** of development effort. The most challenging aspects are:

1. Correctly handling map hierarchy with precedence rules
2. Maintaining performance through caching
3. Invalidating cache correctly when maps change

The recommended approach is phased implementation, starting with basic key resolution (Phase 1-3) which provides most user value, then adding advanced features incrementally.

This feature would significantly enhance DitaCraft's usefulness for real-world DITA projects that heavily rely on key-based content reuse.
