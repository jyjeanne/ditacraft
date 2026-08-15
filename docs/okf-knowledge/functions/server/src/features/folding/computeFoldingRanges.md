---
type: TypeScript Function
title: computeFoldingRanges
resource: server/src/features/folding.ts#L36-L94
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/folding/buildLineOffsets
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/folding/lineAtOffset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/tagStack/resyncStackToMatch
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/folding/handleFoldingRanges
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function computeFoldingRanges(text: string): FoldingRange[]`

# Calls

- [buildLineOffsets](../../../../../functions/server/src/features/folding/buildLineOffsets.md)
- [lineAtOffset](../../../../../functions/server/src/features/folding/lineAtOffset.md)
- [resyncStackToMatch](../../../../../functions/server/src/utils/tagStack/resyncStackToMatch.md)

# Called by

- [handleFoldingRanges](../../../../../functions/server/src/features/folding/handleFoldingRanges.md)