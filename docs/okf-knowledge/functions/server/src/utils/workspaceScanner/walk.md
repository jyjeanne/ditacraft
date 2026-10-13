---
type: TypeScript Function
title: walk
resource: server/src/utils/workspaceScanner.ts#L24-L43
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/features/moveTopic/isDirectory
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function walk(dir: string): void`

# Calls

- [isDirectory](../../../../../functions/server/src/features/moveTopic/isDirectory.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)