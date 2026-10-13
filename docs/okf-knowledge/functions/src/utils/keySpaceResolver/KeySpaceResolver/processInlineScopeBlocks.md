---
type: TypeScript Method
title: processInlineScopeBlocks
resource: src/utils/keySpaceResolver.ts#L1175-L1253
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private processInlineScopeBlocks( content: string, mapPath: string, parentEffectivePrefixes: string[], keySpace: KeySpace, scopeDirectKeys: Map<string, KeyDefinition[]>, bfsQueue: Array<{ mapPath: string; scopePrefixes: string[] }>, depth = 0 ): string`

# Calls

- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)