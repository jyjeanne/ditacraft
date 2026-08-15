---
type: TypeScript Method
title: parseMapElements
resource: server/src/services/keySpaceService.ts#L972-L988
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/collectXmlElements
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitions
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private parseMapElements( mapContent: string ): Array<{ tagName: string; attrs: Record<string, string>; node: Record<string, unknown> }> | null`

# Calls

- [collectXmlElements](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/collectXmlElements.md)

# Called by

- [extractKeyDefinitions](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitions.md)