---
type: TypeScript Method
title: extractInlineScopeBlocks
resource: server/src/services/keySpaceService.ts#L1936-L1996
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private extractInlineScopeBlocks(content: string): Array<{ keyscopes: string[]; inlineKeys: string[]; innerContent: string; outerStart: number; outerEnd: number; }>`

# Calls

- [match](../../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)