---
type: TypeScript Function
title: discoverRootMap
resource: mcp/src/utils/mapDiscovery.ts#L11-L35
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/features/moveTopic/isDirectory
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
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

# Calls

- [isDirectory](../../../../../functions/server/src/features/moveTopic/isDirectory.md)
- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [readKeysResource](../../../../../functions/mcp/src/resources/keys/readKeysResource.md)
- [handleDitaKeySpace](../../../../../functions/mcp/src/tools/ditaKeySpace/handleDitaKeySpace.md)