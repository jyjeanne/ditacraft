---
type: TypeScript Function
title: commonMarks
resource: src/shared/editor/commands.ts#L839-L845
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/commands/DitaCommands/insertInline
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/links/LinkCommands/setLink
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function commonMarks(content: Fragment): readonly Mark[]`

# Called by

- [insertInline](../../../../../functions/src/shared/editor/commands/DitaCommands/insertInline.md)
- [setLink](../../../../../functions/src/shared/editor/links/LinkCommands/setLink.md)