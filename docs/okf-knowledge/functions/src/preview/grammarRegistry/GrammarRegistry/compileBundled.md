---
type: TypeScript Method
title: compileBundled
resource: src/preview/grammarRegistry.ts#L147-L165
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/grammarCache/compileWithCache
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private compileBundled(relShell: string): Grammar | undefined`

# Calls

- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [compileWithCache](../../../../../functions/src/shared/grammar/grammarCache/compileWithCache.md)