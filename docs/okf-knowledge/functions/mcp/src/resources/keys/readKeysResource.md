---
type: TypeScript Function
title: readKeysResource
resource: mcp/src/resources/keys.ts#L21-L67
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/mcp/src/resources/query/invalidParameter
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/utils/mapDiscovery/discoverRootMap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/getAllKeys
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/mcp/src/server/readKeys
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function readKeysResource( params: Record<string, string>, ctx: McpContext, ): Promise<KeysResourceResult>`

# Calls

- [invalidParameter](../../../../../functions/mcp/src/resources/query/invalidParameter.md)
- [discoverRootMap](../../../../../functions/mcp/src/utils/mapDiscovery/discoverRootMap.md)
- [getAllKeys](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/getAllKeys.md)

# Called by

- [readKeys](../../../../../functions/mcp/src/server/readKeys.md)