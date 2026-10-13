---
type: TypeScript Function
title: listFiles
resource: src/test/shared/helpers.ts#L19-L35
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/moveTopic/isDirectory
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function listFiles(dir: string, pattern: RegExp, out: string[] = []): string[]`

# Calls

- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [isDirectory](../../../../../functions/server/src/features/moveTopic/isDirectory.md)