---
type: TypeScript Method
title: extractKeyDefinitions
resource: server/src/services/keySpaceService.ts#L1084-L1094
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/parseMapElements
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitionsFromElements
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitionsRegex
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private extractKeyDefinitions( mapContent: string, mapPath: string, maxMatches: number ): KeyDefinition[]`

# Calls

- [parseMapElements](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/parseMapElements.md)
- [extractKeyDefinitionsFromElements](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitionsFromElements.md)
- [extractKeyDefinitionsRegex](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitionsRegex.md)