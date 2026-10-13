---
type: TypeScript Method
title: childByToken
resource: src/shared/render/toHtml.ts#L291-L293
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/types/isElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/render/toHtml/Renderer/number
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/renderTgroup
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`childByToken(el: ElementNode, token: string): ElementNode | undefined`

# Calls

- [find](../../../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [isElement](../../../../../../functions/src/shared/cst/types/isElement.md)
- [has](../../../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [number](../../../../../../functions/src/shared/render/toHtml/Renderer/number.md)
- [renderTgroup](../../../../../../functions/src/shared/render/toHtml/renderTgroup.md)