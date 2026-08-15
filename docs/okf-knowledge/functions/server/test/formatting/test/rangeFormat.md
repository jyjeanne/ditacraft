---
type: TypeScript Function
title: rangeFormat
resource: server/test/formatting.test.ts#L132-L142
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/test/helper/createDocsFromContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/formatting/handleRangeFormatting
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function rangeFormat(content: string, range: Range)`

# Calls

- [createDocsFromContent](../../../../../functions/server/test/helper/createDocsFromContent.md)
- [handleRangeFormatting](../../../../../functions/server/src/features/formatting/handleRangeFormatting.md)