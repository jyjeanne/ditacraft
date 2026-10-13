---
type: JavaScript Function
title: key
resource: scripts/screenshots/lib.js#L230-L235
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/scripts/screenshots/shoot/shotContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/refreshContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/refreshContext
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function key(cdp, k, modifiers = 0)`

# Called by

- [shotContext](../../../functions/scripts/screenshots/shoot/shotContext.md)
- [refreshContext](../../../functions/src/editor/visualEditorProvider/EditorSession/refreshContext.md)
- [refreshContext](../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/refreshContext.md)