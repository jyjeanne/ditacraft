---
type: TypeScript Function
title: control
resource: webview/properties/main.ts#L81-L131
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/properties/el
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/properties/row
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function control(field: PropertyField, editable: boolean, id: string): HTMLElement`

# Calls

- [el](../../../functions/webview/properties/el.md)
- [has](../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [row](../../../functions/webview/properties/row.md)