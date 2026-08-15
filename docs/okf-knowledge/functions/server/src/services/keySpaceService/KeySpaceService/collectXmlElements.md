---
type: TypeScript Method
title: collectXmlElements
resource: server/src/services/keySpaceService.ts#L994-L1023
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/parseMapElements
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private collectXmlElements( obj: unknown, out: Array<{ tagName: string; attrs: Record<string, string>; node: Record<string, unknown> }>, tagName = '' ): void`

# Called by

- [parseMapElements](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/parseMapElements.md)