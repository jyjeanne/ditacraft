---
type: TypeScript Function
title: discoverRootMap
resource: mcp/src/utils/mapDiscovery.ts#L11-L35
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/mcp/src/resources/keys/readKeysResource
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/tools/ditaKeySpace/handleDitaKeySpace
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function discoverRootMap(workspaceRoot: string, maxDepth = DEFAULT_SCAN_DEPTH): string | null`

# Called by

- [readKeysResource](../../../../../functions/mcp/src/resources/keys/readKeysResource.md)
- [handleDitaKeySpace](../../../../../functions/mcp/src/tools/ditaKeySpace/handleDitaKeySpace.md)