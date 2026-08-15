---
type: TypeScript Function
title: findContainingWorkspaceFolder
resource: server/src/utils/textUtils.ts#L144-L154
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/normalizeFsPath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/keySpaceService/KeySpaceService/doFindRootMap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/isPathWithinWorkspace
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findContainingWorkspaceFolder( absolutePath: string, workspaceFolders: readonly string[], ): string | undefined`

# Calls

- [normalizeFsPath](../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)

# Called by

- [doFindRootMap](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/doFindRootMap.md)
- [isPathWithinWorkspace](../../../../../functions/server/src/utils/textUtils/isPathWithinWorkspace.md)