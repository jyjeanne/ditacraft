---
type: TypeScript Function
title: resolveKeyref
resource: mcp/src/tools/ditaResolveReference.ts#L52-L117
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/mcp/src/workspace/fileUriToFsPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/workspace/resolvePath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/tools/ditaResolveReference/extractTitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/tools/ditaResolveReference/detectTopicType
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/mcp/src/tools/ditaResolveReference/handleDitaResolveReference
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/tools/ditaResolveReference/resolveConkeyref
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function resolveKeyref( keyName: string, fromUri: string | undefined, ctx: McpContext, trace: string[], visited: Set<string> = new Set(), ): Promise<ResolveReferenceResult>`

# Calls

- [fileUriToFsPath](../../../../../functions/mcp/src/workspace/fileUriToFsPath.md)
- [resolvePath](../../../../../functions/mcp/src/workspace/resolvePath.md)
- [extractTitle](../../../../../functions/mcp/src/tools/ditaResolveReference/extractTitle.md)
- [detectTopicType](../../../../../functions/mcp/src/tools/ditaResolveReference/detectTopicType.md)

# Called by

- [handleDitaResolveReference](../../../../../functions/mcp/src/tools/ditaResolveReference/handleDitaResolveReference.md)
- [resolveConkeyref](../../../../../functions/mcp/src/tools/ditaResolveReference/resolveConkeyref.md)