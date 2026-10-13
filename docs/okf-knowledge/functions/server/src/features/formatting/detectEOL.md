---
type: TypeScript Function
title: detectEOL
resource: server/src/features/formatting.ts#L323-L327
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/formatting/formatXML
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function detectEOL(text: string): string`

# Calls

- [match](../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)

# Called by

- [formatXML](../../../../../functions/server/src/features/formatting/formatXML.md)