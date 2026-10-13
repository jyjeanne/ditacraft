---
type: TypeScript Method
title: extractMetadataFromNode
resource: server/src/services/keySpaceService.ts#L1175-L1218
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/services/keySpaceService/nodeText
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitionsFromElements
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private extractMetadataFromNode( node: Record<string, unknown> ): { metadata: KeyMetadata | null; inlineContent: string | null }`

# Calls

- [nodeText](../../../../../../functions/server/src/services/keySpaceService/nodeText.md)

# Called by

- [extractKeyDefinitionsFromElements](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitionsFromElements.md)