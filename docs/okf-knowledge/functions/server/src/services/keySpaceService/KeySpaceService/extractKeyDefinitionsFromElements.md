---
type: TypeScript Method
title: extractKeyDefinitionsFromElements
resource: server/src/services/keySpaceService.ts#L1237-L1352
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/computeLineNumber
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/isWebAddress
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

- [startsWith](../../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [computeLineNumber](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/computeLineNumber.md)
- [has](../../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [isWebAddress](../../../../../../functions/server/src/services/keySpaceService/isWebAddress.md)
- [extractMetadataFromNode](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractMetadataFromNode.md)

# Called by

- [extractKeyDefinitions](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitions.md)