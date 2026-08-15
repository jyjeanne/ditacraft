---
type: TypeScript Function
title: collectDitaFilesAsync
resource: server/src/utils/workspaceScanner.ts#L55-L83
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/findReplace/handleComputeFindReplaceEdits
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/moveTopic/handleComputeMoveEdits
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/collectCrossFileEdits
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/workspaceValidation/detectUnusedTopics
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/workspaceValidation/WorkspaceIndex/buildFull
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function collectDitaFilesAsync(workspaceFolders: readonly string[]): Promise<string[]>`

# Called by

- [handleComputeFindReplaceEdits](../../../../../functions/server/src/features/findReplace/handleComputeFindReplaceEdits.md)
- [handleComputeMoveEdits](../../../../../functions/server/src/features/moveTopic/handleComputeMoveEdits.md)
- [collectCrossFileEdits](../../../../../functions/server/src/features/rename/collectCrossFileEdits.md)
- [detectUnusedTopics](../../../../../functions/server/src/features/workspaceValidation/detectUnusedTopics.md)
- [buildFull](../../../../../functions/server/src/features/workspaceValidation/WorkspaceIndex/buildFull.md)