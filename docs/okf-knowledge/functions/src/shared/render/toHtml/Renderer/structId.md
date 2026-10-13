---
type: TypeScript Method
title: structId
resource: src/shared/render/toHtml.ts#L316-L323
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/elementIndex/ElementIndex/idOf
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/render/toHtml/Renderer/footnoteMarker
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/tableKey
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/attrs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/element
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/metaRows
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`structId(el: ElementNode): string | undefined`

# Calls

- [idOf](../../../../../../functions/src/shared/cst/elementIndex/ElementIndex/idOf.md)

# Called by

- [footnoteMarker](../../../../../../functions/src/shared/render/toHtml/Renderer/footnoteMarker.md)
- [tableKey](../../../../../../functions/src/shared/render/toHtml/Renderer/tableKey.md)
- [attrs](../../../../../../functions/src/shared/render/toHtml/Renderer/attrs.md)
- [element](../../../../../../functions/src/shared/render/toHtml/Renderer/element.md)
- [metaRows](../../../../../../functions/src/shared/render/toHtml/metaRows.md)