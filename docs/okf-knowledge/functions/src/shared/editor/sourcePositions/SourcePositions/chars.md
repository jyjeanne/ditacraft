---
type: TypeScript Method
title: chars
resource: src/shared/editor/sourcePositions.ts#L43-L61
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/sourcePositions/SourcePositions/positionOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/sourcePositions/SourcePositions/offsetOf
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private chars(block: PMNode): { chars: Char[]; atoms: { rel: number; o: NodeOrigin }[] }`

# Called by

- [positionOf](../../../../../../functions/src/shared/editor/sourcePositions/SourcePositions/positionOf.md)
- [offsetOf](../../../../../../functions/src/shared/editor/sourcePositions/SourcePositions/offsetOf.md)