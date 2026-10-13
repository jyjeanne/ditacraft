---
type: TypeScript Function
title: insertImageData
resource: webview/editor/main.ts#L1451-L1459
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/labels/format
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/insertImages
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/debug
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function insertImageData(items: { data: string; mime: string; name?: string }[]): Promise<void>`

# Calls

- [format](../../../functions/src/shared/render/labels/format.md)
- [insertImages](../../../functions/webview/editor/insertImages.md)

# Called by

- [debug](../../../functions/webview/editor/debug.md)