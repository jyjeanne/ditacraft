---
type: TypeScript Function
title: findClosingTagEnd
resource: server/src/utils/elementExtent.ts#L105-L141
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/inlineConref/findConrefElementAtOffset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/elementExtent/findElementExtentById
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findClosingTagEnd(searchableText: string, tagName: string, fromOffset: number): ClosingTagSpan | undefined`

# Called by

- [findConrefElementAtOffset](../../../../../functions/server/src/features/inlineConref/findConrefElementAtOffset.md)
- [findElementExtentById](../../../../../functions/server/src/utils/elementExtent/findElementExtentById.md)