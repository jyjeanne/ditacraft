---
type: TypeScript Function
title: apply
resource: src/test/shared/editorImages.test.ts#L80-L92
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
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

`function apply(run: Run, command: Command): Run & { out: string }`

# Calls

- [serializeDocument](../../../../../../functions/src/shared/editor/toSource/serializeDocument.md)
- [readingSignature](../../../../../../functions/src/test/shared/editorHelpers/readingSignature.md)
- [buildDocument](../../../../../../functions/src/shared/editor/toProseMirror/buildDocument.md)