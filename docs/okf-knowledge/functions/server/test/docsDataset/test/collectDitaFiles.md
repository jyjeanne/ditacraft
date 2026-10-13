---
type: TypeScript Function
title: collectDitaFiles
resource: server/test/docsDataset.test.ts#L40-L53
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/features/moveTopic/isDirectory
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function collectDitaFiles(dir: string): string[]`

# Calls

- [isDirectory](../../../../../functions/server/src/features/moveTopic/isDirectory.md)
- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)