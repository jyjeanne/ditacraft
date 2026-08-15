---
type: TypeScript Function
title: isPathWithinWorkspace
resource: server/src/utils/textUtils.ts#L128-L133
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/findContainingWorkspaceFolder
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isPathWithinWorkspace(absolutePath: string, workspaceFolders: readonly string[]): boolean`

# Calls

- [findContainingWorkspaceFolder](../../../../../functions/server/src/utils/textUtils/findContainingWorkspaceFolder.md)