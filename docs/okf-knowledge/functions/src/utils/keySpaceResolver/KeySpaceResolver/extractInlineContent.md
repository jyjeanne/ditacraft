---
type: TypeScript Method
title: extractInlineContent
resource: src/utils/keySpaceResolver.ts#L851-L862
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/extractKeyDefinitions
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private extractInlineContent(mapContent: string, startIndex: number): string | null`

# Calls

- [match](../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)

# Called by

- [extractKeyDefinitions](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/extractKeyDefinitions.md)