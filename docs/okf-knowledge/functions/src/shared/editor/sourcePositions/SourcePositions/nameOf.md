---
type: TypeScript Method
title: nameOf
resource: src/shared/editor/sourcePositions.ts#L38-L40
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/problems/problemMarks
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/sourceChange/sourceChange
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/sourcePositions/SourcePositions/positionOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/sourcePositions/SourcePositions/offsetOf
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private nameOf(n: PMNode): string`

# Called by

- [problemMarks](../../../../../../functions/src/shared/editor/problems/problemMarks.md)
- [sourceChange](../../../../../../functions/src/shared/editor/sourceChange/sourceChange.md)
- [positionOf](../../../../../../functions/src/shared/editor/sourcePositions/SourcePositions/positionOf.md)
- [offsetOf](../../../../../../functions/src/shared/editor/sourcePositions/SourcePositions/offsetOf.md)