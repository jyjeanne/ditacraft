---
type: TypeScript Function
title: formatXML
resource: server/src/features/formatting.ts#L130-L259
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/formatting/tokenize
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/formatting/detectEOL
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/formatting/flush
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/formatting/getSimpleTextContent
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/formatting/handleFormatting
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/formatting/handleRangeFormatting
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function formatXML( text: string, tabSize: number, insertSpaces: boolean ): string`

# Calls

- [tokenize](../../../../../functions/server/src/features/formatting/tokenize.md)
- [detectEOL](../../../../../functions/server/src/features/formatting/detectEOL.md)
- [flush](../../../../../functions/server/src/features/formatting/flush.md)
- [getSimpleTextContent](../../../../../functions/server/src/features/formatting/getSimpleTextContent.md)

# Called by

- [handleFormatting](../../../../../functions/server/src/features/formatting/handleFormatting.md)
- [handleRangeFormatting](../../../../../functions/server/src/features/formatting/handleRangeFormatting.md)