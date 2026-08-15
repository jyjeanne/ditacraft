---
type: TypeScript Method
title: resolveKeyEntryWithScope
resource: server/src/services/keySpaceService.ts#L276-L334
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/normalizeFsPath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/resolveKey
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/resolveKeyEntry
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async resolveKeyEntryWithScope( keyName: string, contextFilePath: string ): Promise<{ def: KeyDefinition; keys: Map<string, KeyDefinition>; scopePrefix: string } | null>`

# Calls

- [get](../../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [normalizeFsPath](../../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)

# Called by

- [resolveKey](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/resolveKey.md)
- [resolveKeyEntry](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/resolveKeyEntry.md)