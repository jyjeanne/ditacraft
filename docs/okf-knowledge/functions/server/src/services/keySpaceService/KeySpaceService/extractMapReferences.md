---
type: TypeScript Method
title: extractMapReferences
resource: server/src/services/keySpaceService.ts#L1649-L1696
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private extractMapReferences( mapContent: string, mapPath: string, maxLinkMatches: number ): { path: string; keyscopes: string[]; inlineKeys: string[]; isPeer: boolean }[]`

# Calls

- [startsWith](../../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [match](../../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)