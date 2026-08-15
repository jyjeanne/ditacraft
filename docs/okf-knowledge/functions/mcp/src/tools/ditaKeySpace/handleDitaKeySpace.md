---
type: TypeScript Function
title: handleDitaKeySpace
resource: mcp/src/tools/ditaKeySpace.ts#L31-L94
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/mcp/src/workspace/resolvePath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/utils/mapDiscovery/discoverRootMap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/getAllKeys
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function handleDitaKeySpace( args: unknown, ctx: McpContext, ): Promise<DitaKeySpaceResult>`

# Calls

- [resolvePath](../../../../../functions/mcp/src/workspace/resolvePath.md)
- [discoverRootMap](../../../../../functions/mcp/src/utils/mapDiscovery/discoverRootMap.md)
- [getAllKeys](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/getAllKeys.md)