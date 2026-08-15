---
type: TypeScript Function
title: findElementExtentById
resource: server/src/utils/elementExtent.ts#L49-L77
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/escapeRegex
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/elementExtent/findClosingTagEnd
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/hover/getConrefPreview
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/inlineConref/handleComputeInlineConrefEdit
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findElementExtentById(content: string, elementId: string): ElementExtent | undefined`

# Calls

- [escapeRegex](../../../../../functions/server/src/utils/textUtils/escapeRegex.md)
- [findClosingTagEnd](../../../../../functions/server/src/utils/elementExtent/findClosingTagEnd.md)

# Called by

- [getConrefPreview](../../../../../functions/server/src/features/hover/getConrefPreview.md)
- [handleComputeInlineConrefEdit](../../../../../functions/server/src/features/inlineConref/handleComputeInlineConrefEdit.md)