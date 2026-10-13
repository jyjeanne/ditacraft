---
type: TypeScript Method
title: current
resource: src/shared/editor/links.ts#L71-L79
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/links/LinkCommands/linkAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/runMenuItem
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/pickAndSetLink
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`current(state: EditorState): LinkTarget | undefined`

# Calls

- [linkAt](../../../../../../functions/src/shared/editor/links/LinkCommands/linkAt.md)
- [find](../../../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [runMenuItem](../../../../../../functions/webview/editor/runMenuItem.md)
- [pickAndSetLink](../../../../../../functions/webview/editor/pickAndSetLink.md)