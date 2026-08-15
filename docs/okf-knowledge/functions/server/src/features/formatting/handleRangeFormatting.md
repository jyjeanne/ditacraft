---
type: TypeScript Function
title: handleRangeFormatting
resource: server/src/features/formatting.ts#L71-L122
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/formatting/formatXML
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/test/formatting/test/rangeFormat
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function handleRangeFormatting( params: DocumentRangeFormattingParams, documents: TextDocuments<TextDocument> ): TextEdit[]`

# Calls

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [formatXML](../../../../../functions/server/src/features/formatting/formatXML.md)

# Called by

- [rangeFormat](../../../../../functions/server/test/formatting/test/rangeFormat.md)