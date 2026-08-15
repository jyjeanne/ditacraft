---
type: TypeScript Method
title: extractKeyDefinitionsFromElements
resource: server/src/services/keySpaceService.ts#L1097-L1210
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/computeLineNumber
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/extractMetadataFromNode
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitions
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private extractKeyDefinitionsFromElements( elements: Array<{ tagName: string; attrs: Record<string, string>; node: Record<string, unknown> }>, mapPath: string, maxMatches: number, mapContent?: string ): KeyDefinition[]`

# Calls

- [computeLineNumber](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/computeLineNumber.md)
- [get](../../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [extractMetadataFromNode](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractMetadataFromNode.md)

# Called by

- [extractKeyDefinitions](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitions.md)