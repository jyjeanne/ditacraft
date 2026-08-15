---
type: TypeScript Function
title: resolveHref
resource: server/src/features/contextGraph.ts#L108-L129
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/test/suite/keySpaceResolver/test/normalize
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/contextGraph/buildMapNode
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function resolveHref(href: string, baseDir: string, workspaceFolders: readonly string[]): string | null`

# Calls

- [normalize](../../../../../functions/src/test/suite/keySpaceResolver/test/normalize.md)

# Called by

- [buildMapNode](../../../../../functions/server/src/features/contextGraph/buildMapNode.md)