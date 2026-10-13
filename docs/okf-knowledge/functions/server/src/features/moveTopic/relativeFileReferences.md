---
type: TypeScript Function
title: relativeFileReferences
resource: server/src/features/moveTopic.ts#L97-L113
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/moveTopic/handleComputeMoveEdits
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function relativeFileReferences(content: string): FileReference[]`

# Calls

- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [handleComputeMoveEdits](../../../../../functions/server/src/features/moveTopic/handleComputeMoveEdits.md)