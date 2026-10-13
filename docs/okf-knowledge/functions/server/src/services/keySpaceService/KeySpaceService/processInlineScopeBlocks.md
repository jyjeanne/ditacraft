---
type: TypeScript Method
title: processInlineScopeBlocks
resource: server/src/services/keySpaceService.ts#L2099-L2206
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private processInlineScopeBlocks( content: string, mapPath: string, parentEffectivePrefixes: string[], keySpace: KeySpace, scopeDirectKeys: Map<string, KeyDefinition[]>, bfsQueue: Array<{ mapPath: string; scopePrefixes: string[] }>, maxLinkMatches: number, depth = 0 ): string`

# Calls

- [has](../../../../../../functions/src/shared/render/toHtml/Renderer/has.md)