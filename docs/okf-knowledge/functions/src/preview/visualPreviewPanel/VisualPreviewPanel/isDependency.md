---
type: TypeScript Method
title: isDependency
resource: src/preview/visualPreviewPanel.ts#L417-L424
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/paths/samePath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/registerListeners
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private isDependency(fsPath: string): boolean`

# Calls

- [samePath](../../../../../functions/src/preview/paths/samePath.md)

# Called by

- [registerListeners](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/registerListeners.md)