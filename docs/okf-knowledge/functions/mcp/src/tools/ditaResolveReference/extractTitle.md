---
type: TypeScript Function
title: extractTitle
resource: mcp/src/tools/ditaResolveReference.ts#L227-L235
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/mcp/src/tools/ditaResolveReference/resolveKeyref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/tools/ditaResolveReference/resolveHrefOrConref
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function extractTitle(filePath: string): string | undefined`

# Calls

- [match](../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)

# Called by

- [resolveKeyref](../../../../../functions/mcp/src/tools/ditaResolveReference/resolveKeyref.md)
- [resolveHrefOrConref](../../../../../functions/mcp/src/tools/ditaResolveReference/resolveHrefOrConref.md)