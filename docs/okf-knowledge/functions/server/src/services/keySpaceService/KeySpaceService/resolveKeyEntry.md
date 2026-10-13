---
type: TypeScript Method
title: resolveKeyEntry
resource: server/src/services/keySpaceService.ts#L324-L330
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/resolveKeyEntryWithScope
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/rename/resolveUsage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/collectMatchingKeyEdits
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public async resolveKeyEntry( keyName: string, contextFilePath: string ): Promise<KeyDefinition | null>`

# Calls

- [resolveKeyEntryWithScope](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/resolveKeyEntryWithScope.md)

# Called by

- [resolveUsage](../../../../../../functions/server/src/features/rename/resolveUsage.md)
- [collectMatchingKeyEdits](../../../../../../functions/server/src/features/rename/collectMatchingKeyEdits.md)