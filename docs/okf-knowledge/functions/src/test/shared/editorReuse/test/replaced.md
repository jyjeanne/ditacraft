---
type: TypeScript Function
title: replaced
resource: src/test/shared/editorReuse.test.ts#L102-L130
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/test/shared/editorReuse/test/copyOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/buildDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/buildFragment
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/serializeDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorHelpers/readingSignature
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function replaced(which: Reuse): Promise<{ out: string; state: EditorState; base: Base }>`

# Calls

- [copyOf](../../../../../../functions/src/test/shared/editorReuse/test/copyOf.md)
- [buildDocument](../../../../../../functions/src/shared/editor/toProseMirror/buildDocument.md)
- [buildFragment](../../../../../../functions/src/shared/editor/toProseMirror/buildFragment.md)
- [serializeDocument](../../../../../../functions/src/shared/editor/toSource/serializeDocument.md)
- [readingSignature](../../../../../../functions/src/test/shared/editorHelpers/readingSignature.md)