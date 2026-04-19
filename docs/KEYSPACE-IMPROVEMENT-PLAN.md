# Keyspace Algorithm Improvement Plan

*Analysis based on pydita reference implementation (github.com/jyjeanne/pydita)*

---

## Executive Summary

The pydita Python library implements a rigorous DITA key space construction algorithm
that matches the DITA 1.3/2.0 specification more completely than the current ditacraft
implementation. This document maps the gaps and defines a phased improvement plan.

---

## 1. Algorithm Comparison

### 1.1 pydita Architecture

pydita builds key spaces in **three ordered phases**:

| Phase | What it does |
|-------|--------------|
| **Phase 1 – BFS traversal** | Walk the resolved map tree; create a `KeySpace` node for every scope-defining element (`@keyscope`). Add key definitions to the nearest enclosing scope. |
| **Phase 2 – PullUp** | Walk the `KeySpace` tree bottom-up. Copy scope-qualified key names (e.g. `childScope.key`) from every child scope into its parent scope, recursively up to the root. |
| **Phase 3 – PushDown** | Walk the `KeySpace` tree top-down. Push ancestor key definitions into descendant scopes so that, from within a child scope, unqualified ancestor keys resolve correctly. |

Key data structures:

```python
KeyDefinition
    keyName: str
    keydefElems: list[Element]   # priority-ordered list of key-defining elements
    keySpace: KeySpace            # owning scope

KeySpace
    keyScopeNames: set[str]
    keydefsByKeyName: dict[str, list[KeyDefinition]]   # key name → priority list
    keyspacesByScopeName: dict[str, list[KeySpace]]    # child scopes by name
    keyspacesByDefiner: dict[Element, KeySpace]        # definer elem → space
    peerKeyscopes: dict[str, list[Element]]            # peer map refs by scope name
    _isDeferred: bool                                  # lazy-load flag
```

`resolveKey(keyName, mapcontext)` walks up from the element's containing scope to
find the definition, following `@keyref` chains with a configurable hop limit (default 3).

### 1.2 ditacraft Architecture (current)

ditacraft uses a **single-phase BFS** that builds a flat `Map<string, KeyDefinition>`.
Scope prefixes are computed inline during traversal using a cross-product helper.

```typescript
KeySpace {
    keys: Map<string, KeyDefinition>   // key name → single winning definition
    duplicateKeys: Map<string, KeyDefinition[]>
    subjectSchemePaths: string[]
}
```

`resolveKey(keyName)` is a direct `Map.get(keyName)` lookup — no scope context,
no keyref chain following.

---

## 2. Gap Analysis

### Gap 1 — No PushDown Pass (missing scope inheritance) ★★★

**What is missing**: Ancestor keys are not pushed into descendant scopes.

**Impact**: Within a nested scope, unqualified references to keys defined in an ancestor
scope may fail to resolve if the key was not re-defined inside the child scope.

**DITA spec reference**: DITA 1.3 §2.4.4 — "Keys in a scope can be referenced using the
unqualified key name from within the same scope or any descendant scope."

**pydita solution**: `PushDownVisitor` traverses the `KeySpace` tree top-down and calls
`addKeyDefinitions()` on each child scope with the parent's definitions (lower priority).

**ditacraft fix**: After the BFS builds per-scope key dictionaries, add a second pass that
walks down the scope tree and merges ancestor key definitions (at lower priority) into
each descendant scope's flat map.

---

### Gap 2 — No Keyref Chain Resolution ★★★

**What is missing**: When a key definition carries `@keyref="otherKey"`, resolving the
original key does not follow through to the target.

**Impact**: Indirect key definitions (used heavily for content reuse and product
variants) return the intermediate keydef element instead of the final resource.

**pydita solution**: `KeySpace.resolveKey()` checks for `@keyref` on the keydef element
and recurses with `hopsRemaining -= 1`, stopping at 0 to prevent cycles.

```python
keyref = definer.get("keyref")
if keyref is not None and hopsRemaining:
    return self.resolveKey(keyref, mapcontext=definer, hopsRemaining=hopsRemaining-1)
```

**ditacraft fix** (`keySpaceService.ts` → `resolveKey` / `buildKeySpace`):

```typescript
// When returning a KeyDefinition, check for a keyref attribute on the definer element.
// If present, and hopsRemaining > 0, recurse:
private followKeyrefChain(keyDef: KeyDefinition, hops = 3): KeyDefinition | null {
    if (!keyDef.keyref || hops <= 0) return keyDef;
    const next = keySpace.keys.get(keyDef.keyref);
    return next ? this.followKeyrefChain(next, hops - 1) : keyDef;
}
```

This requires adding a `keyref?: string` field to the `KeyDefinition` interface and
populating it during `extractKeyDefinitions()`.

---

### Gap 3 — Context-Free Key Resolution ★★

**What is missing**: `resolveKey(keyName, contextFilePath)` ignores the scope context of
the authoring file. It cannot determine which child scope the context file belongs to
and therefore cannot give priority to scope-local key definitions.

**Impact**: When two sibling scopes define the same unqualified key name, the effective
definition depends entirely on BFS traversal order rather than the authoring context.

**pydita solution**: `KeySpace.resolveKey(keyName, mapcontext)` walks from the element's
`mapcontext` up through `keyspacesByDefiner` to find the innermost enclosing scope, then
resolves within that scope before bubbling up.

**ditacraft fix**: Build a reverse index `topicToScope: Map<string, string>` that maps
each topic file path to the scope it belongs to. Then in `resolveKey`, look up the
scope for `contextFilePath` and prefer its definitions.

---

### Gap 4 — Single Winning Definition (no priority list) ★★

**What is missing**: For each key name, only the first-encountered definition is stored.
The server tracks duplicates separately but they are not integrated into the resolution
pipeline.

**Impact**: Tooling cannot offer the full analysis (e.g., showing all overrides and
which one wins at a given authoring context) that is available in pydita.

**pydita solution**: `keydefsByKeyName: dict[str, list[KeyDefinition]]` stores all
definitions in priority order. `getKeyDefiner()` returns `keydefElems[0]` for resolution
but callers can inspect the full priority list.

**ditacraft fix**: Extend `KeySpace` with a `priorityKeys: Map<string, KeyDefinition[]>`.
The `KeySpaceViewProvider` "Duplicate Keys" tree node can then surface the full priority
chain, not just the pair of (winner, first duplicate).

---

### Gap 5 — Deferred Peer Map Loading (missing lazy init) ★

**What is missing**: Peer maps (`@scope="peer"`) are skipped during BFS. Their key spaces
are never constructed, even on demand.

**Impact**: Cross-map key references from content that relies on peer maps always resolve
to `undefined`, even when the referenced map is available on disk.

**pydita solution**: `KeyspaceManager.addDeferredKeyspace()` registers a deferred
`KeySpace` (with `_isDeferred = True`) for every peer mapref. The first resolution
attempt against a deferred space triggers `constructDeferredKeyspace()`.

**ditacraft fix**: During BFS, when a `@scope="peer"` + `@keyscope` + `@href` mapref
is found, register it in a `deferredPeerMaps: Map<string, string>` (scope name → map
path). On a cache miss in `resolveKey`, attempt to load and merge the peer map's key
space before returning `null`.

---

### Gap 6 — Regex XML Parsing vs. DTD-Aware Parser ★

**What is missing**: ditacraft extracts key definitions with regular expressions rather
than a proper XML parser.

**Impact**: Edge cases — keys split across continuation lines, CDATA with embedded
angle brackets, attribute ordering variations, namespace prefixes — may cause missed
or incorrect extractions.

**pydita solution**: Uses `lxml` with DITA OT catalog for DTD-aware parsing; element
class matching via `@class` attribute (`ditautils.isClass(elem, "map/topicref")`).

**ditacraft fix**: Opportunistic — the existing `stripCommentsAndCDATA()` pre-processor
already eliminates many edge cases. Full XML parsing would require bundling a lightweight
parser (e.g., `fast-xml-parser` already used in the validation pipeline). This should
be done when the regex approach produces demonstrable failures.

---

## 3. Implementation Plan

### Phase 1 — Keyref Chain Resolution (High value, low risk)

**Target**: `server/src/services/keySpaceService.ts` + `src/utils/keySpaceResolver.ts`

Steps:
1. Add `keyref?: string` to `KeyDefinition` interface.
2. In `extractKeyDefinitions()`, capture `@keyref` attribute from each keydef element.
3. Add private `followKeyrefChain(keyDef, keys, hops=3)` helper that follows the chain
   with hop limiting and cycle detection.
4. Call `followKeyrefChain` inside `resolveKey()` before returning.
5. Add unit tests: direct key → key with keyref → indirect keyref chain → cycle guard.

**Estimated effort**: 1–2 days  
**Risk**: Low — purely additive, no restructuring.

---

### Phase 2 — PushDown Scope Inheritance

**Target**: `server/src/services/keySpaceService.ts`

Steps:
1. During BFS, build a parallel scope tree:
   ```typescript
   interface ScopeNode {
       scopeNames: string[];
       scopePrefixes: string[];      // fully-qualified scope path
       keys: Map<string, KeyDefinition>;
       children: ScopeNode[];
   }
   ```
2. After BFS completes, do a top-down tree walk. For each `ScopeNode`, merge parent
   keys into the child's key map (at lower priority — `Map.set` only if not already
   present).
3. Then flatten the scope tree back into `keySpace.keys`, including both unqualified
   (relative to each scope) and fully-qualified variants.
4. Update tests in `keySpaceService.test.ts` to cover ancestor key resolution from
   within nested scopes.

**Estimated effort**: 3–4 days  
**Risk**: Medium — changes BFS result shape; existing tests will guard regressions.

---

### Phase 3 — Context-Aware Resolution + Priority Lists

**Target**: `server/src/services/keySpaceService.ts`, `KeySpaceService` public API

Steps:
1. During BFS, build `topicToScope: Map<string, ScopeNode>` (topic path → owning scope).
2. Change `resolveKey(keyName, contextFilePath)` to:
   a. Look up the scope node for `contextFilePath`.
   b. Try `scopeNode.keys.get(keyName)`.
   c. If not found, walk up `scopeNode` ancestors.
   d. Fall back to root scope.
3. Extend `KeySpace.priorityKeys: Map<string, KeyDefinition[]>` for tooling.
4. Expose in `getDuplicateKeys()` + update `KeySpaceViewProvider` tree.

**Estimated effort**: 4–5 days  
**Risk**: Medium — changes public API of `resolveKey`; all callers (completion, hover,
definition, diagnostics) need to pass `contextFilePath`, which most already do.

---

### Phase 4 — Deferred Peer Map Loading

**Target**: `server/src/services/keySpaceService.ts`

Steps:
1. During BFS, detect `@scope="peer" @keyscope @href` maprefs and register them in
   `deferredPeers: Map<string, string>` (scope name → absolute map path).
2. In `resolveKey`, after failing local lookup, check if `keyName` starts with a known
   peer scope prefix. If so, lazily call `buildKeySpace(peerMapPath)` and merge.
3. Cache peer map key spaces under their root map path (reuses existing cache).
4. Add integration tests with a fixture workspace that has a peer map.

**Estimated effort**: 3–4 days  
**Risk**: Low-Medium — isolated to the resolution path; does not affect main BFS.

---

## 4. Priority Summary

| # | Gap | Impact | Effort | Phase |
|---|-----|--------|--------|-------|
| 2 | Keyref chain resolution | High | Low | 1 |
| 1 | PushDown scope inheritance | High | Medium | 2 |
| 3 | Context-aware resolution | Medium | Medium | 3 |
| 4 | Priority list per key | Medium | Low | 3 |
| 5 | Deferred peer map loading | Medium | Medium | 4 |
| 6 | XML parser replacement | Low | High | Backlog |

---

## 5. Files Affected

| File | Changes |
|------|---------|
| `server/src/services/keySpaceService.ts` | Phases 1–4 (main logic) |
| `src/utils/keySpaceResolver.ts` | Phase 1 (keyref chain, client mirror) |
| `server/src/services/interfaces.ts` | Extended `IKeySpaceService` signature |
| `server/src/test/keySpaceService.test.ts` | New test cases for all phases |
| `src/test/keySpaceResolver.test.ts` | New test cases for phase 1 |
| `docs/KEY-SPACE-RESOLUTION.md` | Update spec to match new behaviour |

---

## 6. Test Fixtures Needed

The following DITA fixture files should be added to the test suite to validate new
behaviour:

```
test/fixtures/keyspace/
    peer-scope/
        root.ditamap          # references peer.ditamap as @scope="peer" @keyscope="peer"
        peer.ditamap          # defines key "peer-key"
    keyref-chain/
        root.ditamap          # key "alias" → @keyref="real", key "real" → href
    scope-inheritance/
        root.ditamap          # defines key "shared" at root scope
        child-scope.ditamap   # @keyscope="child", does NOT redefine "shared"
    scope-override/
        root.ditamap          # defines key "shared" at root AND in child scope
        child-scope.ditamap   # @keyscope="child", overrides "shared"
```

---

*Reference: pydita source — `src/pydita/keyspace.py`, `src/pydita/keyspacemgr.py`,
`src/pydita/keyspacevisitors.py` (branch: develop)*
