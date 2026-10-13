---
type: TypeScript Function
title: resolveKeyref
resource: mcp/src/tools/ditaResolveReference.ts#L52-L117
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/workspace/fileUriToFsPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/tools/ditaResolveReference/extractTitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/tools/ditaResolveReference/detectTopicType
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function resolveKeyref( keyName: string, fromUri: string | undefined, ctx: McpContext, trace: string[], visited: Set<string> = new Set(), ): Promise<ResolveReferenceResult>`

# Calls

- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [fileUriToFsPath](../../../../../functions/mcp/src/workspace/fileUriToFsPath.md)
- [extractTitle](../../../../../functions/mcp/src/tools/ditaResolveReference/extractTitle.md)
- [detectTopicType](../../../../../functions/mcp/src/tools/ditaResolveReference/detectTopicType.md)