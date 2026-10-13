---
type: TypeScript Method
title: followKeyrefChainWithTrace
resource: server/src/services/keySpaceService.ts#L1563-L1592
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/explainKey
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private followKeyrefChainWithTrace( startDef: KeyDefinition, keys: Map<string, KeyDefinition>, scopePrefix: string ): { def: KeyDefinition; chain: string[] }`

# Calls

- [has](../../../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [explainKey](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/explainKey.md)