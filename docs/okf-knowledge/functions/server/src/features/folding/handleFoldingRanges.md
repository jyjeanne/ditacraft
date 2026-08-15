---
type: TypeScript Function
title: handleFoldingRanges
resource: server/src/features/folding.ts#L24-L32
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/folding/computeFoldingRanges
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function handleFoldingRanges( params: FoldingRangeParams, documents: TextDocuments<TextDocument> ): FoldingRange[]`

# Calls

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [computeFoldingRanges](../../../../../functions/server/src/features/folding/computeFoldingRanges.md)