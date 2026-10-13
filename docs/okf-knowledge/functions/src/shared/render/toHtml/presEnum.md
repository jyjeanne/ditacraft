---
type: TypeScript Function
title: presEnum
resource: src/shared/render/toHtml.ts#L69-L71
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/render/toHtml/Renderer/attrs
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

`function presEnum(value: string | undefined, allowed: Set<string>): string | undefined`

# Calls

- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [attrs](../../../../../functions/src/shared/render/toHtml/Renderer/attrs.md)
- [presentation](../../../../../functions/src/shared/render/toHtml/presentation.md)
- [rows](../../../../../functions/src/shared/render/toHtml/rows.md)
- [cell](../../../../../functions/src/shared/render/toHtml/cell.md)