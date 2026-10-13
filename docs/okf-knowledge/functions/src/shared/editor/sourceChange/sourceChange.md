---
type: TypeScript Function
title: sourceChange
resource: src/shared/editor/sourceChange.ts#L83-L219
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/sourcePositions/SourcePositions/nameOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/sourceChange/keepMarks
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/detachNode
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/sourceChange/touched
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/sourceChange/enclosing
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/sourceChange/sourceChangeTransaction
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function sourceChange(doc: PMNode, fresh: BuildResult, next: BuildResult, es: EditorSchema, span: TextSpan): SourceChangePlan | undefined`

# Calls

- [nameOf](../../../../../functions/src/shared/editor/sourcePositions/SourcePositions/nameOf.md)
- [keepMarks](../../../../../functions/src/shared/editor/sourceChange/keepMarks.md)
- [detachNode](../../../../../functions/src/shared/editor/toProseMirror/detachNode.md)
- [touched](../../../../../functions/src/shared/editor/sourceChange/touched.md)
- [enclosing](../../../../../functions/src/shared/editor/sourceChange/enclosing.md)

# Called by

- [sourceChangeTransaction](../../../../../functions/src/shared/editor/sourceChange/sourceChangeTransaction.md)