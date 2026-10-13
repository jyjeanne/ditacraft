---
type: TypeScript Function
title: updateReuseBar
resource: webview/editor/main.ts#L1677-L1698
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/selectedReuse
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/xmlValue
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/reuseAction
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/editable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/placeReuseBar
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/noteReuse
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/updateUi
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function updateReuseBar(): void`

# Calls

- [selectedReuse](../../../functions/webview/editor/selectedReuse.md)
- [xmlValue](../../../functions/webview/editor/xmlValue.md)
- [reuseAction](../../../functions/webview/editor/reuseAction.md)
- [editable](../../../functions/webview/editor/editable.md)
- [placeReuseBar](../../../functions/webview/editor/placeReuseBar.md)

# Called by

- [noteReuse](../../../functions/webview/editor/noteReuse.md)
- [updateUi](../../../functions/webview/editor/updateUi.md)