---
type: TypeScript Function
title: attrValue
resource: src/preview/conditionMarks.ts#L99-L102
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/html/decodeXmlText
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/conditionMarks/conditionMarks
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function attrValue(attrsText: string | undefined, name: string): string | undefined`

# Calls

- [match](../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)
- [decodeXmlText](../../../../functions/src/shared/render/html/decodeXmlText.md)

# Called by

- [conditionMarks](../../../../functions/src/preview/conditionMarks/conditionMarks.md)