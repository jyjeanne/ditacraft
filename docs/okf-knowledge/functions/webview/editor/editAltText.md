---
type: TypeScript Function
title: editAltText
resource: webview/editor/main.ts#L1434-L1448
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/images/ImageCommands/selectedImage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editor/test/nodeAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/setAlt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/rawOf
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/runMenuItem
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function editAltText(): Promise<void>`

# Calls

- [selectedImage](../../../functions/src/shared/editor/images/ImageCommands/selectedImage.md)
- [nodeAt](../../../functions/src/test/shared/editor/test/nodeAt.md)
- [setAlt](../../../functions/src/shared/editor/images/ImageCommands/setAlt.md)
- [rawOf](../../../functions/webview/editor/rawOf.md)

# Called by

- [runMenuItem](../../../functions/webview/editor/runMenuItem.md)