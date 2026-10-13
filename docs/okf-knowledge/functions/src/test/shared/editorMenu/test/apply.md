---
type: TypeScript Function
title: apply
resource: src/test/shared/editorMenu.test.ts#L53-L68
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/test/shared/editorMenu/test/stateAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/serializeDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorHelpers/readingSignature
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/buildDocument
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function apply(source: string, text: string, command: Command, select = false, expected = true): { out: string; state: EditorState }`

# Calls

- [stateAt](../../../../../../functions/src/test/shared/editorMenu/test/stateAt.md)
- [serializeDocument](../../../../../../functions/src/shared/editor/toSource/serializeDocument.md)
- [readingSignature](../../../../../../functions/src/test/shared/editorHelpers/readingSignature.md)
- [buildDocument](../../../../../../functions/src/shared/editor/toProseMirror/buildDocument.md)