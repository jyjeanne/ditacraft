---
type: TypeScript Function
title: handleDitaExplainKey
resource: mcp/src/tools/ditaExplainKey.ts#L28-L67
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/mcp/src/workspace/resolvePath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/explainKey
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function handleDitaExplainKey( args: unknown, ctx: McpContext, ): Promise<ExplainKeyResult>`

# Calls

- [resolvePath](../../../../../functions/mcp/src/workspace/resolvePath.md)
- [explainKey](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/explainKey.md)