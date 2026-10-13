---
type: TypeScript Method
title: attrText
resource: src/shared/render/toHtml.ts#L325-L328
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/html/decodeXmlText
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/render/toHtml/Renderer/footnoteMarker
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/footnoteTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/attrs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/renderTgroup
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/presentation
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/rows
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/cell
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`attrText(el: ElementNode, name: string): string | undefined`

# Calls

- [decodeXmlText](../../../../../../functions/src/shared/render/html/decodeXmlText.md)

# Called by

- [footnoteMarker](../../../../../../functions/src/shared/render/toHtml/Renderer/footnoteMarker.md)
- [footnoteTarget](../../../../../../functions/src/shared/render/toHtml/Renderer/footnoteTarget.md)
- [attrs](../../../../../../functions/src/shared/render/toHtml/Renderer/attrs.md)
- [renderTgroup](../../../../../../functions/src/shared/render/toHtml/renderTgroup.md)
- [presentation](../../../../../../functions/src/shared/render/toHtml/presentation.md)
- [rows](../../../../../../functions/src/shared/render/toHtml/rows.md)
- [cell](../../../../../../functions/src/shared/render/toHtml/cell.md)