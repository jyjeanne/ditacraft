---
type: TypeScript Method
title: extractKeyDefinitionsRegex
resource: server/src/services/keySpaceService.ts#L1213-L1306
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/computeLineNumber
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
- [extractKeyMetadata](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractKeyMetadata.md)

# Called by

- [extractKeyDefinitions](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitions.md)