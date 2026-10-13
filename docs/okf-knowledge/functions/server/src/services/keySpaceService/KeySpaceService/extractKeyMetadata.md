---
type: TypeScript Method
title: extractKeyMetadata
resource: server/src/services/keySpaceService.ts#L1456-L1532
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitionsRegex
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private extractKeyMetadata( mapContent: string, startIndex: number ): { metadata: KeyMetadata | null; inlineContent: string | null }`

# Calls

- [match](../../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)

# Called by

- [extractKeyDefinitionsRegex](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitionsRegex.md)