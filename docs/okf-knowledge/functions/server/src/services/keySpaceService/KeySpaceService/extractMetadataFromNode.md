---
type: TypeScript Method
title: extractMetadataFromNode
resource: server/src/services/keySpaceService.ts#L1028-L1078
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitionsFromElements
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private extractMetadataFromNode( node: Record<string, unknown> ): { metadata: KeyMetadata | null; inlineContent: string | null }`

# Called by

- [extractKeyDefinitionsFromElements](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitionsFromElements.md)