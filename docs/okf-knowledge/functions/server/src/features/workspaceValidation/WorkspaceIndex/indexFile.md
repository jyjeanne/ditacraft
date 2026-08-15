---
type: TypeScript Method
title: indexFile
resource: server/src/features/workspaceValidation.ts#L258-L277
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/workspaceValidation/extractRootId
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/normalizeFsPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/workspaceValidation/WorkspaceIndex/buildFull
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/workspaceValidation/WorkspaceIndex/updateFile
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async indexFile(filePath: string): Promise<void>`

# Calls

- [extractRootId](../../../../../../functions/server/src/features/workspaceValidation/extractRootId.md)
- [normalizeFsPath](../../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)
- [get](../../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)

# Called by

- [buildFull](../../../../../../functions/server/src/features/workspaceValidation/WorkspaceIndex/buildFull.md)
- [updateFile](../../../../../../functions/server/src/features/workspaceValidation/WorkspaceIndex/updateFile.md)