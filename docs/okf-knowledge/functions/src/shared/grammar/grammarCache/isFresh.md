---
type: TypeScript Function
title: isFresh
resource: src/shared/grammar/grammarCache.ts#L64-L72
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/grammar/grammarCache/statDependency
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/grammar/grammarCache/compileWithCache
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isFresh(entry: CacheEntry): boolean`

# Calls

- [statDependency](../../../../../functions/src/shared/grammar/grammarCache/statDependency.md)

# Called by

- [compileWithCache](../../../../../functions/src/shared/grammar/grammarCache/compileWithCache.md)