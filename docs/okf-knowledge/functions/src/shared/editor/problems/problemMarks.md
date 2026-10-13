---
type: TypeScript Function
title: problemMarks
resource: src/shared/editor/problems.ts#L54-L187
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/sourcePositions/SourcePositions/nameOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editor/test/nodeAt
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/test/shared/editorProblems/test/marksFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/showProblems
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function problemMarks(doc: PMNode, fresh: BuildResult, items: readonly ProblemItem[], es: EditorSchema): ProblemMark[]`

# Calls

- [nameOf](../../../../../functions/src/shared/editor/sourcePositions/SourcePositions/nameOf.md)
- [nodeAt](../../../../../functions/src/test/shared/editor/test/nodeAt.md)

# Called by

- [marksFor](../../../../../functions/src/test/shared/editorProblems/test/marksFor.md)
- [showProblems](../../../../../functions/webview/editor/showProblems.md)