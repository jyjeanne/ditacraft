---
type: TypeScript Function
title: withoutMarks
resource: src/shared/editor/commands.ts#L847-L851
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

`function withoutMarks(content: Fragment, marks: readonly Mark[]): Fragment`

# Called by

- [insertInline](../../../../../functions/src/shared/editor/commands/DitaCommands/insertInline.md)
- [setLink](../../../../../functions/src/shared/editor/links/LinkCommands/setLink.md)