---
type: TypeScript Method
title: followKeyrefChain
resource: src/utils/keySpaceResolver.ts#L1650-L1667
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private followKeyrefChain( keyDef: KeyDefinition, keys: Map<string, KeyDefinition>, scopePrefix = '', hopsRemaining = 3, visited = new Set<string>() ): KeyDefinition`

# Calls

- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)