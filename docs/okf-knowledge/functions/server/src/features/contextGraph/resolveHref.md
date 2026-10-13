---
type: TypeScript Function
title: resolveHref
resource: server/src/features/contextGraph.ts#L108-L129
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function resolveHref(href: string, baseDir: string, workspaceFolders: readonly string[]): string | null`

# Calls

- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [match](../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)