---
type: TypeScript Function
title: edited
resource: src/test/shared/editorProblems.test.ts#L43-L56
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toProseMirror/buildDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/serializeDocument
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function edited(source: string, change?: (tr: Transaction, doc: PMNode) => void): Edited`

# Calls

- [buildDocument](../../../../../../functions/src/shared/editor/toProseMirror/buildDocument.md)
- [serializeDocument](../../../../../../functions/src/shared/editor/toSource/serializeDocument.md)