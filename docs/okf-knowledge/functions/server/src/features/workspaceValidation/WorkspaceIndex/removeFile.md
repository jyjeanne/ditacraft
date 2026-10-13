---
type: TypeScript Method
title: removeFile
resource: server/src/features/workspaceValidation.ts#L232-L248
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/normalizeFsPath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/workspaceValidation/WorkspaceIndex/updateFile
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`removeFile(filePath: string): void`

# Calls

- [normalizeFsPath](../../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)

# Called by

- [updateFile](../../../../../../functions/server/src/features/workspaceValidation/WorkspaceIndex/updateFile.md)