---
type: TypeScript Method
title: doFindRootMap
resource: server/src/services/keySpaceService.ts#L613-L676
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/findContainingWorkspaceFolder
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/normalizeFsPath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/findRootMap
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async doFindRootMap(absolutePath: string, cacheKey: string): Promise<string | null>`

# Calls

- [findContainingWorkspaceFolder](../../../../../../functions/server/src/utils/textUtils/findContainingWorkspaceFolder.md)
- [normalizeFsPath](../../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)

# Called by

- [findRootMap](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/findRootMap.md)