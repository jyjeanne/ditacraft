# Keyspace Algorithm Improvement Plan

---

## Executive Summary

The existing ditacraft keyspace algorithm uses a single-pass BFS that builds a
flat `Map<string, KeyDefinition>`.  Several DITA 1.3/2.0 behaviours are either
missing or partially implemented.  This document records the gaps and the
four-phase implementation roadmap that has been applied to
`server/src/services/keySpaceService.ts` and `src/utils/keySpaceResolver.ts`.

---

## 1. Improved Algorithm

The revised algorithm runs in **three ordered phases**:

| Phase | What it does |
|-------|--------------|
| **Phase 1 – BFS traversal** | Walk the map hierarchy; collect key definitions into the flat `keys` map; simultaneously populate `scopeDirectKeys` (per-scope direct key list) and `topicToScope` (topic file → owning scope prefix). Scope-qualified aliases (e.g. `product.key`) are generated inline here — this is the ditacraft equivalent of pydita's dedicated "pull-up" phase (see §1.1 below). |
| **Phase 2 – PushDown** | After BFS, walk every non-root scope.  For each ancestor scope, inject its direct keys into the descendant's qualified namespace (e.g. `product.lib.version`) at lower priority (existing child-scope definitions are never overwritten). |
| **Phase 3 – Keyref chain** | In `resolveKey`, follow any `@keyref` chain on the returned definition up to 3 hops, with cycle detection. |

### 1.1 Pull-up vs push-down — comparison with pydita reference implementation

The [pydita reference implementation](../samples_project/pydita-develop/docs/KEYSPACE_CONSTRUCTION_ALGORITHM.md)
uses **three separate phases**:

| pydita phase | Ditacraft equivalent |
|---|---|
| Phase 1 — structural population | Phase 1 BFS (identical goal) |
| Phase 2 — **pull-up**: add `childscope.key` qualified aliases into ancestor spaces (post-order walk) | Merged into Phase 1 BFS: when a child scope's keys are extracted they are immediately registered in the root `keys` map under `childscope.key`, achieving the same result in a single pass |
| Phase 3 — **push-down**: prepend ancestor definitions into descendants so inherited ancestor definitions win for duplicate names | Phase 2 PushDown: same goal, but ditacraft does **not** overwrite existing child-scope definitions — child scope wins for same-name collisions (opposite of pydita's ancestor-wins policy — see §1.2) |

### 1.2 Precedence model

Ditacraft and pydita apply different precedence rules for same-name key collisions after push-down:

| Scenario | Ditacraft | pydita |
|---|---|---|
| Same key in ancestor and descendant | **Child-scope wins** — `if (!keySpace.keys.has(inheritedName))` guard prevents overwrite | **Ancestor wins** — push-down uses prepend semantics, so inherited ancestor definitions sort higher |
| BFS encounter order | First-definition-wins | First-definition-wins |
| Context-aware lookup (`resolveKey` with `contextFilePath`) | Tries `prefix.keyName` first, falls back to unqualified name | Resolves from the matching child `KeySpace` object directly |

The ditacraft choice (child-scope wins) matches the DITA spec intent: a child scope can
locally override an ancestor key definition.  pydita's ancestor-wins policy is stricter
and may be intentional for their use case.  **This difference is documented but intentional.**

### 1.3 Context-aware resolution

Before the flat lookup, `resolveKey(keyName, contextFilePath)` checks whether
the authoring file belongs to a named scope via `topicToScope`.  If so, it tries
the fully-qualified variant (e.g. `product.lib.version`) first — giving the
child scope's own override priority over the root-level definition — and only
falls back to the unqualified `keyName` when no scope-specific entry exists.

---

## 2. Gap Analysis

### Gap 1 — No PushDown pass (missing scope inheritance) ★★★ — **FIXED**

**What was missing**: Ancestor keys were not pushed into descendant scopes.

**Impact**: Within a nested scope, unqualified references to keys defined in an
ancestor scope could fail to resolve if the key was not re-defined inside the
child scope.

**DITA spec reference**: DITA 1.3 §2.4.4 — "Keys in a scope can be referenced
using the unqualified key name from within the same scope or any descendant scope."

**Fix applied** (`doBuildKeySpace`): After the BFS, a second pass walks every
child scope prefix, finds all ancestor prefixes, and registers their direct key
definitions under the child-scope namespace (e.g. `product.lib.version`) if that
qualified name is not already present.

```typescript
for (const [childPrefix] of scopeDirectKeys) {
    if (childPrefix === '') continue;
    const parts = childPrefix.split('.');
    for (let depth = 0; depth < parts.length; depth++) {
        const ancestorPrefix = parts.slice(0, depth).join('.');
        for (const ancestorKey of scopeDirectKeys.get(ancestorPrefix) ?? []) {
            const inheritedName = `${childPrefix}.${ancestorKey.keyName}`;
            if (!keySpace.keys.has(inheritedName)) {
                keySpace.keys.set(inheritedName, { ...ancestorKey, keyName: inheritedName });
            }
        }
    }
}
```

---

### Gap 2 — No keyref chain resolution ★★★ — **FIXED**

**What was missing**: When a key definition carried `@keyref="otherKey"`,
resolving the original key returned the intermediate alias definition instead of
the final resource.

**Impact**: Indirect key definitions (used heavily for content reuse and product
variants) did not reach the actual target.

**Fix applied** — new `followKeyrefChain` method (both server and client):

```typescript
private followKeyrefChain(
    keyDef: KeyDefinition,
    keys: Map<string, KeyDefinition>,
    hopsRemaining = 3,
    visited = new Set<string>()
): KeyDefinition {
    if (!keyDef.keyref || hopsRemaining <= 0 || visited.has(keyDef.keyName)) {
        return keyDef;
    }
    visited.add(keyDef.keyName);
    const next = keys.get(keyDef.keyref);
    if (!next) return keyDef;
    return this.followKeyrefChain(next, keys, hopsRemaining - 1, visited);
}
```

`@keyref` is now captured on `KeyDefinition` during key extraction, and
`resolveKey()` calls `followKeyrefChain` on every returned definition.

---

### Gap 3 — Context-free key resolution ★★ — **FIXED**

**What was missing**: `resolveKey(keyName, contextFilePath)` ignored the scope
context of the authoring file.  When two sibling scopes defined the same key,
the effective definition depended on BFS traversal order rather than which scope
the authoring file actually belonged to.

**Fix applied** (`resolveKey`):

1. During BFS, `extractTopicReferences()` records each topic file's primary
   scope prefix in `keySpace.topicToScope`.
2. In `resolveKey`, the owning scope prefix is looked up for `contextFilePath`.
3. The scope-qualified name (`${prefix}.${keyName}`) is tried first; the flat
   unqualified name is used as fallback.

---

### Gap 4 — No deferred peer map loading ★★ — **FIXED**

**What was missing**: Peer maps (`@scope="peer"`) are skipped during BFS.  Their
key spaces are never constructed, even on demand.

**Fix applied** (`doBuildKeySpace` + `resolveKey`):

1. During BFS, detect `@scope="peer" @keyscope @href` maprefs and register them
   in `deferredPeerMaps: Map<string, string>` (scope name → absolute map path).
2. In `resolveKey`, on a cache miss for a scope-qualified name, lazily load and
   merge the peer map's key space before returning `null`.

**Validation rules enforced** (from KEYSPACE_CONSTRUCTION_GUIDE):
- `@scope` must be `peer`
- `@keyscope` must exist and have at least one token
- `@href` must resolve to a readable target (on lazy load)

---

### Gap 5 — Regex XML parsing ★ — **FIXED**

**What was missing**: Key definitions were extracted with regular expressions rather
than a proper XML parser, so some edge cases (multi-line attributes, namespace
prefixes) were missed.

**Fix applied**: `extractKeyDefinitions` now uses `fast-xml-parser` (already used
in the validation pipeline) as the primary extraction path, with the original
regex logic retained as a fallback for malformed XML.

Notable edge cases handled:
- Multi-line attribute values
- Namespace-prefixed attributes (`xlink:href` → `href`)
- XML processing instructions (`?xml`) not treated as key elements
- `topicmeta` returned as array (fxp behavior for duplicate elements) — normalized
  to first entry

---

### Gap 6 — No provenance tracking ★ — **FIXED**

**What was missing**: Each `KeyDefinition` only stored the source map path
(`sourceMap`), not the specific element position (line number, element ID, or
XPath) within that map.

**Impact**:
- Duplicate key warnings could not point to the exact conflicting element.
- Explainability checks ("why did this definition win?") required reconstructing
  traversal order from context alone.
- The KEYSPACE_CONSTRUCTION_GUIDE recommends: "retain provenance on each key
  definition (source file URI, element identifier, and traversal position)."

**Fix applied**:

1. Added `sourceLine?: number` to `KeyDefinition` (1-based line number within `sourceMap`).
2. New private helper `computeLineNumber(content, charIndex)` counts newlines before the match position.
3. **Regex path** (`extractKeyDefinitionsRegex`): `sourceLine = computeLineNumber(mapContent, match.index)`.
4. **XML path** (`extractKeyDefinitionsFromElements`): now accepts `mapContent`; a running `contentSearchPos` tracks position for a monotone forward scan (O(n) total), locating the `keys=` attribute to compute line numbers.
5. Qualified scope aliases (spread copies) inherit `sourceLine` from the original definition.

```typescript
private computeLineNumber(content: string, charIndex: number): number {
    let line = 1;
    const end = Math.min(charIndex, content.length);
    for (let i = 0; i < end; i++) {
        if (content[i] === '\n') line++;
    }
    return line;
}
```

**Estimated effort**: 2–3 days | **Risk**: Low

---

### Gap 7 — Scope explosion / combinatorial keyscope growth ★ — **FIXED**

**What was missing**: DITA allows a single `@keyscope` attribute to declare
multiple scope names (space-separated tokens).  A map with `keyscope="a b"` must
synthesize _two_ independent child scopes.  A map with many multi-token keyscopes
(the "scope explosion" scenario from pydita's `keyscope-explosion.ditamap` test)
can cause the number of qualified key aliases to grow combinatorially.

**Impact**:
- Multi-token keyscopes may not register all expected qualified aliases.
- Very large maps with many scopes may exhibit quadratic memory or time growth.

**Fix applied**:

1. **Multi-token keyscope correctness** — confirmed `combineScopePrefixes` correctly generates the cross-product of parent × child scope token arrays (e.g. `keyscope="x y"` parent + `keyscope="c d"` child → `x.c`, `x.d`, `y.c`, `y.d`). No code change needed here.

2. **Explosion cap** — added `MAX_KEY_SPACE_ENTRIES = 50_000` constant and a `addScopedKeyEntry` helper used at every qualified-alias insertion site:

```typescript
private addScopedKeyEntry(keySpace: KeySpace, qualifiedName: string, def: KeyDefinition): void {
    if (keySpace.keys.has(qualifiedName)) return;
    if (keySpace.keys.size >= MAX_KEY_SPACE_ENTRIES) {
        keySpace.scopeExplosionWarning = true;
        return;
    }
    keySpace.keys.set(qualifiedName, def);
}
```

This guards all 6 qualified-alias insertion sites (BFS main loop, BFS submap inline keys, PushDown pass, inline scope inline keys, inline scope block keys, inline scope submap keys).  Unqualified direct definitions are always admitted.

3. **`scopeExplosionWarning?: boolean`** added to `KeySpace` so callers can detect that some aliases were dropped.

**Estimated effort**: 1–2 days | **Risk**: Low-Medium

---

## 3. Implementation Summary

| Phase | Effort | Status |
|-------|--------|--------|
| 1 — Keyref chain resolution | 1–2 days | ✅ Done |
| 2 — PushDown scope inheritance | 2–3 days | ✅ Done |
| 3 — Context-aware resolution | 1–2 days | ✅ Done |
| 4 — Deferred peer map loading | 3–4 days | ✅ Done |
| 5 — XML parser replacement | 3–4 days | ✅ Done |
| 6 — Provenance tracking | 2–3 days | ✅ Done |
| 7 — Scope explosion handling | 1–2 days | ✅ Done |

---

## 4. Implementation Checklist (from KEYSPACE_CONSTRUCTION_GUIDE)

- [x] Deterministic traversal order (BFS queue, consistent processing)
- [x] First-definition-wins encounter order
- [x] Pull-up: descendant keys visible as scope-qualified aliases in ancestors
- [x] Push-down: ancestor keys inherited by descendants (child-scope-wins on collision)
- [x] Peer scope lazy materialization on key miss
- [x] Canonical URI normalization via `path.normalize`
- [x] Keyref chain with cycle detection (≤3 hops)
- [x] Context-based resolution (topicToScope index)
- [x] Provenance per key definition (`sourceLine` on `KeyDefinition`, both XML and regex paths)
- [x] Scope explosion cap (`MAX_KEY_SPACE_ENTRIES = 50_000`, `scopeExplosionWarning` flag)
- [x] Reporting tools for explainable resolution: `explainKey()` method + `reportKeySpace()` / `formatResolutionReport()` standalone functions

---

## 5. Files Changed

| File | Changes |
|------|---------|
| `server/src/services/keySpaceService.ts` | `KeyDefinition.keyref`, `KeySpace.topicToScope`, PushDown in `doBuildKeySpace`, context-aware + keyref chain in `resolveKey`, new `followKeyrefChain` and `extractTopicReferences` methods; `KeySpace.deferredPeerMaps`, peer detection in `extractMapReferences`, lazy peer resolution in `resolveKey`; `XMLParser`-based `extractKeyDefinitions` (regex fallback), new `parseMapElements`, `collectXmlElements`, `extractMetadataFromNode` helpers; `KeyDefinition.sourceLine`, `computeLineNumber` helper, `addScopedKeyEntry` helper, `MAX_KEY_SPACE_ENTRIES` cap, `KeySpace.scopeExplosionWarning` |
| `src/utils/keySpaceResolver.ts` | `KeyDefinition.keyref`, keyref extraction, `followKeyrefChain`, updated `resolveKey` |
| `server/src/services/interfaces.ts` | No change (public API unchanged) |
| `server/test/keySpaceService.test.ts` | New suites: `keyref chain resolution`, `PushDown scope inheritance`, `context-aware key resolution`, `deferred peer map loading (Gap 4)`, `XML-parser key extraction (Gap 5)`, `pydita-inspired test scenarios`, `provenance tracking (Gap 6)`, `scope explosion cap (Gap 7)` |

---

## 6. Test Fixtures Covered by New Tests

```
keyref chain resolution
    keyref attribute is captured on KeyDefinition
    resolveKey follows keyref chain to final definition
    multi-hop keyref chain resolves transitively
    cyclic keyref does not hang — returns a definition
    keyref to missing key returns the alias definition itself

PushDown scope inheritance
    ancestor key is accessible via child-scope qualified name
    child-scope override wins over ancestor key in qualified namespace
    deeply nested scope inherits from all ancestors

context-aware key resolution
    resolveKey uses child-scope definition when context is in that scope
    topicToScope maps topic to its owning scope prefix

deferred peer map loading (Gap 4)
    peer mapref with @keyscope is not inlined into main key space
    resolveKey lazily loads peer map and returns key with scope prefix
    peer mapref without @keyscope is ignored (no deferred registration)
    nested key in peer map resolves via scope-qualified name

XML-parser key extraction (Gap 5)
    multi-line attribute value is correctly parsed
    namespace-prefixed href attribute (xlink:href) is resolved
    falls back to regex and still extracts keys when XML is malformed
    inline keyword metadata extracted via XML parser
    topicmeta returned as array (invalid DITA) does not crash
    XML processing instruction (?xml) is not treated as a key-bearing element

peer map keyref chain scope fix (Bug 1)
    keyref chain within scoped peer map resolves via correct scope prefix

pydita-inspired test scenarios
    multiple @keys tokens on one keydef — all keys resolve
    cross-sibling scope path returns null (submap02.submap01.topic-01)
    push-down: inherited key in child scope has same source file as root key
    scope-on-root-map keyscope creates qualified aliases
    string key — keydef with inline content but no href is identifiable
    scope explosion — 25 sibling scopes does not hang

provenance tracking (Gap 6)
    sourceLine is set on keys extracted via regex fallback path
    sourceLine is set on keys extracted via XML parser path
    duplicate keys report different sourceLines
    qualified scope alias inherits sourceLine from original definition

scope explosion cap (Gap 7)
    multi-token @keyscope on submap registers qualified aliases for each token
    nested multi-token keyscopes produce cross-product qualified aliases
    scope explosion warning is set when MAX_KEY_SPACE_ENTRIES is exceeded
```
