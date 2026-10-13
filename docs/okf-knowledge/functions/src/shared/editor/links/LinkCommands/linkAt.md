---
type: TypeScript Method
title: linkAt
resource: src/shared/editor/links.ts#L56-L68
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/links/LinkCommands/isLink
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/contextMenu/contextMenu
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/links/LinkCommands/current
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/links/LinkCommands/setLink
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`linkAt(state: EditorState): { node: PMNode; pos: number } | undefined`

# Calls

- [isLink](../../../../../../functions/src/shared/editor/links/LinkCommands/isLink.md)

# Called by

- [contextMenu](../../../../../../functions/src/shared/editor/contextMenu/contextMenu.md)
- [current](../../../../../../functions/src/shared/editor/links/LinkCommands/current.md)
- [setLink](../../../../../../functions/src/shared/editor/links/LinkCommands/setLink.md)