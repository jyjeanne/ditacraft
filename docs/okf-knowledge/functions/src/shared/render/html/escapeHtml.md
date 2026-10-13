---
type: TypeScript Function
title: escapeHtml
resource: src/shared/render/html.ts#L3-L5
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/render/foreign/renderForeign
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/html/escapeAttr
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/footnoteMarker
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/text
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/node
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/kids
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/flagMarker
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/hidden
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/metaRows
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/generatedHeader
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/renderDocument
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function escapeHtml(text: string): string`

# Called by

- [renderForeign](../../../../../functions/src/shared/render/foreign/renderForeign.md)
- [escapeAttr](../../../../../functions/src/shared/render/html/escapeAttr.md)
- [footnoteMarker](../../../../../functions/src/shared/render/toHtml/Renderer/footnoteMarker.md)
- [text](../../../../../functions/src/shared/render/toHtml/Renderer/text.md)
- [node](../../../../../functions/src/shared/render/toHtml/Renderer/node.md)
- [kids](../../../../../functions/src/shared/render/toHtml/Renderer/kids.md)
- [flagMarker](../../../../../functions/src/shared/render/toHtml/Renderer/flagMarker.md)
- [hidden](../../../../../functions/src/shared/render/toHtml/Renderer/hidden.md)
- [metaRows](../../../../../functions/src/shared/render/toHtml/metaRows.md)
- [generatedHeader](../../../../../functions/src/shared/render/toHtml/generatedHeader.md)
- [renderDocument](../../../../../functions/src/shared/render/toHtml/renderDocument.md)