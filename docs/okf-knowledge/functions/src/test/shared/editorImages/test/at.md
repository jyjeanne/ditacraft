---
type: TypeScript Function
title: at
resource: src/test/shared/editorImages.test.ts#L60-L78
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toProseMirror/buildDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorImages/test/imagePos
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function at(source: string, where: { after?: string; empty?: boolean; image?: boolean }): Run`

# Calls

- [buildDocument](../../../../../../functions/src/shared/editor/toProseMirror/buildDocument.md)
- [imagePos](../../../../../../functions/src/test/shared/editorImages/test/imagePos.md)