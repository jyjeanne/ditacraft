---
type: TypeScript Function
title: mapWithConcurrency
resource: server/src/features/workspaceValidation.ts#L53-L71
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/workspaceValidation/worker
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/batchMetadata/handleComputeBatchMetadataEdits
    resolved_by: tree-sitter
    confidence: exact
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

`async function mapWithConcurrency<T, R>( items: T[], limit: number, fn: (item: T) => Promise<R> ): Promise<R[]>`

# Calls

- [worker](../../../../../functions/server/src/features/workspaceValidation/worker.md)

# Called by

- [handleComputeBatchMetadataEdits](../../../../../functions/server/src/features/batchMetadata/handleComputeBatchMetadataEdits.md)
- [handleComputeFindReplaceEdits](../../../../../functions/server/src/features/findReplace/handleComputeFindReplaceEdits.md)
- [handleComputeMoveEdits](../../../../../functions/server/src/features/moveTopic/handleComputeMoveEdits.md)
- [collectCrossFileEdits](../../../../../functions/server/src/features/rename/collectCrossFileEdits.md)
- [detectUnusedTopics](../../../../../functions/server/src/features/workspaceValidation/detectUnusedTopics.md)
- [buildFull](../../../../../functions/server/src/features/workspaceValidation/WorkspaceIndex/buildFull.md)