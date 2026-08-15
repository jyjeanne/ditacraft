---
type: TypeScript Method
title: buildFull
resource: server/src/features/workspaceValidation.ts#L205-L217
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/workspaceScanner/collectDitaFilesAsync
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/workspaceValidation/mapWithConcurrency
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/workspaceValidation/WorkspaceIndex/indexFile
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async buildFull(workspaceFolders: readonly string[], preScannedFiles?: string[]): Promise<void>`

# Calls

- [collectDitaFilesAsync](../../../../../../functions/server/src/utils/workspaceScanner/collectDitaFilesAsync.md)
- [mapWithConcurrency](../../../../../../functions/server/src/features/workspaceValidation/mapWithConcurrency.md)
- [indexFile](../../../../../../functions/server/src/features/workspaceValidation/WorkspaceIndex/indexFile.md)