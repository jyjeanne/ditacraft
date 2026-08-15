---
type: TypeScript Function
title: tokenize
resource: server/src/features/formatting.ts#L263-L290
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/formatting/formatXML
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/xmlTokenizer/findAttributeAtOffset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/xmlTokenizer/findContextAtOffset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/xmlTokenizer/test/allTokens
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function tokenize(text: string): XMLToken[]`

# Called by

- [formatXML](../../../../../functions/server/src/features/formatting/formatXML.md)
- [findAttributeAtOffset](../../../../../functions/server/src/utils/xmlTokenizer/findAttributeAtOffset.md)
- [findContextAtOffset](../../../../../functions/server/src/utils/xmlTokenizer/findContextAtOffset.md)
- [allTokens](../../../../../functions/server/test/xmlTokenizer/test/allTokens.md)