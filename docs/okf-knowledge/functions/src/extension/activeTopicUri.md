---
type: TypeScript Function
title: activeTopicUri
resource: src/extension.ts#L1375-L1379
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/registerCommands
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function activeTopicUri(): vscode.Uri | undefined`

# Calls

- [find](../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [registerCommands](../../../functions/src/extension/registerCommands.md)