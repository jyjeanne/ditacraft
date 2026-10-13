---
type: TypeScript Function
title: referenceValue
resource: server/src/features/moveTopic.ts#L127-L137
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/features/moveTopic/toHrefPath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/moveTopic/handleComputeMoveEdits
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function referenceValue(fromDir: string, targetPath: string, original: FileReference): string | undefined`

# Calls

- [toHrefPath](../../../../../functions/server/src/features/moveTopic/toHrefPath.md)

# Called by

- [handleComputeMoveEdits](../../../../../functions/server/src/features/moveTopic/handleComputeMoveEdits.md)