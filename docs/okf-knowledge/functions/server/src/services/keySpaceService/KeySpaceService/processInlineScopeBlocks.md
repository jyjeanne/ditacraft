---
type: TypeScript Method
title: processInlineScopeBlocks
resource: server/src/services/keySpaceService.ts#L1937-L2044
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private processInlineScopeBlocks( content: string, mapPath: string, parentEffectivePrefixes: string[], keySpace: KeySpace, scopeDirectKeys: Map<string, KeyDefinition[]>, bfsQueue: Array<{ mapPath: string; scopePrefixes: string[] }>, maxLinkMatches: number, depth = 0 ): string`

# Calls

- [get](../../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)