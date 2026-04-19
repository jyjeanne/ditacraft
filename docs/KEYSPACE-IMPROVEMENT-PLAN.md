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
| **Phase 1 – BFS traversal** | Walk the map hierarchy; collect key definitions into the flat `keys` map; simultaneously populate `scopeDirectKeys` (per-scope direct key list) and `topicToScope` (topic file → owning scope prefix). |
| **Phase 2 – PushDown** | After BFS, walk every non-root scope.  For each ancestor scope, inject its direct keys into the descendant's qualified namespace (e.g. `product.lib.version`) at lower priority (existing child-scope definitions are never overwritten). |
| **Phase 3 – Keyref chain** | In `resolveKey`, follow any `@keyref` chain on the returned definition up to 3 hops, with cycle detection. |

### Context-aware resolution (also in `resolveKey`)

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

### Gap 4 — No deferred peer map loading ★ — _Backlog_

**What is missing**: Peer maps (`@scope="peer"`) are skipped during BFS.  Their
key spaces are never constructed, even on demand.

**Planned fix** (`doBuildKeySpace` + `resolveKey`):

1. During BFS, detect `@scope="peer" @keyscope @href` maprefs and register them
   in a `deferredPeerMaps: Map<string, string>` (scope name → absolute map path).
2. In `resolveKey`, on a cache miss, attempt to lazily load and merge the peer
   map's key space before returning `null`.

**Estimated effort**: 3–4 days | **Risk**: Low-Medium

---

### Gap 5 — Regex XML parsing ★ — _Backlog_

**What is missing**: Key definitions are extracted with regular expressions rather
than a proper XML parser, so some edge cases (multi-line attributes, namespace
prefixes) may be missed.

**Planned fix**: Replace the regex extraction in `extractKeyDefinitions` with a
call into the existing `fast-xml-parser` pipeline (already used in the validation
pipeline) to obtain a proper element tree before attribute extraction.

**Estimated effort**: 3–4 days | **Risk**: Medium (existing tests protect against regressions)

---

## 3. Implementation Summary

| Phase | Effort | Status |
|-------|--------|--------|
| 1 — Keyref chain resolution | 1–2 days | ✅ Done |
| 2 — PushDown scope inheritance | 2–3 days | ✅ Done |
| 3 — Context-aware resolution | 1–2 days | ✅ Done |
| 4 — Deferred peer map loading | 3–4 days | Backlog |
| 5 — XML parser replacement | 3–4 days | Backlog |

---

## 4. Files Changed

| File | Changes |
|------|---------|
| `server/src/services/keySpaceService.ts` | `KeyDefinition.keyref`, `KeySpace.topicToScope`, PushDown in `doBuildKeySpace`, context-aware + keyref chain in `resolveKey`, new `followKeyrefChain` and `extractTopicReferences` methods |
| `src/utils/keySpaceResolver.ts` | `KeyDefinition.keyref`, keyref extraction, `followKeyrefChain`, updated `resolveKey` |
| `server/src/services/interfaces.ts` | No change (public API unchanged) |
| `server/test/keySpaceService.test.ts` | New suites: `keyref chain resolution`, `PushDown scope inheritance`, `context-aware key resolution` |

---

## 5. Test Fixtures Covered by New Tests

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
```
