---
type: TypeScript Method
title: doInvalidate
resource: server/src/services/keySpaceService.ts#L1603-L1635
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/normalizeFsPath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/invalidateForFile
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private doInvalidate(changedFile: string, pathChanged: boolean): void`

# Calls

- [normalizeFsPath](../../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)

# Called by

- [invalidateForFile](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/invalidateForFile.md)