---
type: TypeScript Method
title: extractKeyDefinitionsRegex
resource: server/src/services/keySpaceService.ts#L1355-L1450
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/computeLineNumber
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/isWebAddress
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/extractKeyMetadata
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitions
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private extractKeyDefinitionsRegex( mapContent: string, mapPath: string, maxMatches: number ): KeyDefinition[]`

# Calls

- [computeLineNumber](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/computeLineNumber.md)
- [match](../../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)
- [isWebAddress](../../../../../../functions/server/src/services/keySpaceService/isWebAddress.md)
- [extractKeyMetadata](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractKeyMetadata.md)

# Called by

- [extractKeyDefinitions](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitions.md)