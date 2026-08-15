---
type: TypeScript Method
title: getAllKeys
resource: server/src/services/keySpaceService.ts#L459-L469
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
  - target: functions/server/src/features/completion/getKeyrefCompletions
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public async getAllKeys( contextFilePath: string ): Promise<Map<string, KeyDefinition>>`

# Called by

- [readKeysResource](../../../../../../functions/mcp/src/resources/keys/readKeysResource.md)
- [handleDitaKeySpace](../../../../../../functions/mcp/src/tools/ditaKeySpace/handleDitaKeySpace.md)
- [getKeyrefCompletions](../../../../../../functions/server/src/features/completion/getKeyrefCompletions.md)