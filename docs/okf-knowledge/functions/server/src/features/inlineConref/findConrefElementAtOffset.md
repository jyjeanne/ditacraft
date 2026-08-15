---
type: TypeScript Function
title: findConrefElementAtOffset
resource: server/src/features/inlineConref.ts#L68-L105
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/elementExtent/findClosingTagEnd
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/inlineConref/handleComputeInlineConrefEdit
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findConrefElementAtOffset(text: string, offset: number): ConrefElement | undefined`

# Calls

- [findClosingTagEnd](../../../../../functions/server/src/utils/elementExtent/findClosingTagEnd.md)

# Called by

- [handleComputeInlineConrefEdit](../../../../../functions/server/src/features/inlineConref/handleComputeInlineConrefEdit.md)