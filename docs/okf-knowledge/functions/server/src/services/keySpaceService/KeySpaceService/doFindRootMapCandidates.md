---
type: TypeScript Method
title: doFindRootMapCandidates
resource: server/src/services/keySpaceService.ts#L769-L821
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/findContainingWorkspaceFolder
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/normalizeFsPath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/findRootMapCandidates
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async doFindRootMapCandidates(absolutePath: string, cacheKey: string): Promise<string[]>`

# Calls

- [findContainingWorkspaceFolder](../../../../../../functions/server/src/utils/textUtils/findContainingWorkspaceFolder.md)
- [normalizeFsPath](../../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)

# Called by

- [findRootMapCandidates](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/findRootMapCandidates.md)