---
type: TypeScript Function
title: resolveHrefOrConref
resource: mcp/src/tools/ditaResolveReference.ts#L163-L225
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/referenceParser/parseReference
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/workspace/fileUriToFsPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/workspace/resolvePath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/workspace/validateWithinWorkspace
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
---

# Signature

`function resolveHrefOrConref( value: string, fromUri: string | undefined, ctx: McpContext, trace: string[], ): ResolveReferenceResult`

# Calls

- [parseReference](../../../../../functions/server/src/utils/referenceParser/parseReference.md)
- [fileUriToFsPath](../../../../../functions/mcp/src/workspace/fileUriToFsPath.md)
- [resolvePath](../../../../../functions/mcp/src/workspace/resolvePath.md)
- [validateWithinWorkspace](../../../../../functions/mcp/src/workspace/validateWithinWorkspace.md)
- [extractTitle](../../../../../functions/mcp/src/tools/ditaResolveReference/extractTitle.md)
- [detectTopicType](../../../../../functions/mcp/src/tools/ditaResolveReference/detectTopicType.md)

# Called by

- [handleDitaResolveReference](../../../../../functions/mcp/src/tools/ditaResolveReference/handleDitaResolveReference.md)