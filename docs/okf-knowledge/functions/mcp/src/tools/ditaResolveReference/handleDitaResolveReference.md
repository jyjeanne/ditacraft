---
type: TypeScript Function
title: handleDitaResolveReference
resource: mcp/src/tools/ditaResolveReference.ts#L26-L50
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/mcp/src/tools/ditaResolveReference/resolveKeyref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/tools/ditaResolveReference/resolveConkeyref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/tools/ditaResolveReference/resolveHrefOrConref
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function handleDitaResolveReference( args: unknown, ctx: McpContext, ): Promise<ResolveReferenceResult>`

# Calls

- [resolveKeyref](../../../../../functions/mcp/src/tools/ditaResolveReference/resolveKeyref.md)
- [resolveConkeyref](../../../../../functions/mcp/src/tools/ditaResolveReference/resolveConkeyref.md)
- [resolveHrefOrConref](../../../../../functions/mcp/src/tools/ditaResolveReference/resolveHrefOrConref.md)