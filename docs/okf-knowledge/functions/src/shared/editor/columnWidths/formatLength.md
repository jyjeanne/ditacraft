---
type: TypeScript Function
title: formatLength
resource: src/shared/editor/columnWidths.ts#L43-L48
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/columnWidths/num
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/images/resizedImageSize
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function formatLength(px: number, unit: string, bare: boolean): string`

# Calls

- [num](../../../../../functions/src/shared/editor/columnWidths/num.md)

# Called by

- [resizedImageSize](../../../../../functions/src/shared/editor/images/resizedImageSize.md)