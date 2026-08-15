---
type: TypeScript Method
title: followKeyrefChainWithTrace
resource: server/src/services/keySpaceService.ts#L1408-L1437
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
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

- [get](../../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)

# Called by

- [explainKey](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/explainKey.md)