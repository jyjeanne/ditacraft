---
type: TypeScript Method
title: resolveKeyEntry
resource: server/src/services/keySpaceService.ts#L262-L268
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/resolveKeyEntryWithScope
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/rename/collectMatchingKeyEdits
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public async resolveKeyEntry( keyName: string, contextFilePath: string ): Promise<KeyDefinition | null>`

# Calls

- [resolveKeyEntryWithScope](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/resolveKeyEntryWithScope.md)

# Called by

- [collectMatchingKeyEdits](../../../../../../functions/server/src/features/rename/collectMatchingKeyEdits.md)