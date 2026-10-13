---
type: TypeScript Function
title: marksFor
resource: src/test/shared/editorProblems.test.ts#L79-L81
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/problems/problemMarks
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/buildDocument
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function marksFor(e: Edited, items: ProblemItem[])`

# Calls

- [problemMarks](../../../../../../functions/src/shared/editor/problems/problemMarks.md)
- [buildDocument](../../../../../../functions/src/shared/editor/toProseMirror/buildDocument.md)