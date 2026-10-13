---
type: TypeScript Method
title: extractKeyDefinitions
resource: src/utils/keySpaceResolver.ts#L753-L846
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/warn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/extractInlineContent
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private extractKeyDefinitions(mapContent: string, mapPath: string): KeyDefinition[]`

# Calls

- [match](../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)
- [warn](../../../../../functions/src/utils/logger/Logger/warn.md)
- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [extractInlineContent](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/extractInlineContent.md)