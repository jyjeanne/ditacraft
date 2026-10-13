---
type: TypeScript Function
title: handleFoldingRanges
resource: server/src/features/folding.ts#L24-L32
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/features/folding/computeFoldingRanges
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function handleFoldingRanges( params: FoldingRangeParams, documents: TextDocuments<TextDocument> ): FoldingRange[]`

# Calls

- [computeFoldingRanges](../../../../../functions/server/src/features/folding/computeFoldingRanges.md)