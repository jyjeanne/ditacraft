---
type: TypeScript Function
title: handleFormatting
resource: server/src/features/formatting.ts#L41-L60
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
---

# Signature

`function handleFormatting( params: DocumentFormattingParams, documents: TextDocuments<TextDocument> ): TextEdit[]`

# Calls

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [formatXML](../../../../../functions/server/src/features/formatting/formatXML.md)