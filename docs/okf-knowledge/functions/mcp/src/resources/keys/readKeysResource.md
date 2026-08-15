---
type: TypeScript Function
title: readKeysResource
resource: mcp/src/resources/keys.ts#L17-L59
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/mcp/src/utils/mapDiscovery/discoverRootMap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/getAllKeys
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function readKeysResource( params: Record<string, string>, ctx: McpContext, ): Promise<KeysResourceResult>`

# Calls

- [discoverRootMap](../../../../../functions/mcp/src/utils/mapDiscovery/discoverRootMap.md)
- [getAllKeys](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/getAllKeys.md)