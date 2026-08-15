---
type: TypeScript Method
title: followKeyrefChain
resource: server/src/services/keySpaceService.ts#L1384-L1401
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private followKeyrefChain( keyDef: KeyDefinition, keys: Map<string, KeyDefinition>, scopePrefix = '', hopsRemaining = 3, visited = new Set<string>() ): KeyDefinition`

# Calls

- [get](../../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)