---
type: TypeScript Method
title: extractKeyMetadata
resource: server/src/services/keySpaceService.ts#L1312-L1377
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitionsRegex
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private extractKeyMetadata( mapContent: string, startIndex: number ): { metadata: KeyMetadata | null; inlineContent: string | null }`

# Called by

- [extractKeyDefinitionsRegex](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitionsRegex.md)