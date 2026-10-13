---
type: TypeScript Method
title: setLink
resource: src/shared/editor/links.ts#L88-L131
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/links/LinkCommands/linkAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/links/linkAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/links/LinkCommands/canInsert
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/commonMarks
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/commands/withoutMarks
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/contextMenu/contextMenu
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/plugins
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/pickAndSetLink
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`setLink(target?: LinkTarget): Command`

# Calls

- [linkAt](../../../../../../functions/src/shared/editor/links/LinkCommands/linkAt.md)
- [linkAttributes](../../../../../../functions/src/shared/editor/links/linkAttributes.md)
- [canInsert](../../../../../../functions/src/shared/editor/links/LinkCommands/canInsert.md)
- [commonMarks](../../../../../../functions/src/shared/editor/commands/commonMarks.md)
- [withoutMarks](../../../../../../functions/src/shared/editor/commands/withoutMarks.md)

# Called by

- [contextMenu](../../../../../../functions/src/shared/editor/contextMenu/contextMenu.md)
- [plugins](../../../../../../functions/webview/editor/plugins.md)
- [pickAndSetLink](../../../../../../functions/webview/editor/pickAndSetLink.md)