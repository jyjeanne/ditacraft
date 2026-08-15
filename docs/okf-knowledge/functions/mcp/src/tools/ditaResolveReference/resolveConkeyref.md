---
type: TypeScript Function
title: resolveConkeyref
resource: mcp/src/tools/ditaResolveReference.ts#L119-L161
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/mcp/src/tools/ditaResolveReference/resolveKeyref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/workspace/fileUriToFsPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/workspace/validateWithinWorkspace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/referenceParser/findElementByIdOffset
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/mcp/src/tools/ditaResolveReference/handleDitaResolveReference
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function resolveConkeyref( value: string, fromUri: string | undefined, ctx: McpContext, trace: string[], ): Promise<ResolveReferenceResult>`

# Calls

- [resolveKeyref](../../../../../functions/mcp/src/tools/ditaResolveReference/resolveKeyref.md)
- [fileUriToFsPath](../../../../../functions/mcp/src/workspace/fileUriToFsPath.md)
- [validateWithinWorkspace](../../../../../functions/mcp/src/workspace/validateWithinWorkspace.md)
- [findElementByIdOffset](../../../../../functions/server/src/utils/referenceParser/findElementByIdOffset.md)

# Called by

- [handleDitaResolveReference](../../../../../functions/mcp/src/tools/ditaResolveReference/handleDitaResolveReference.md)