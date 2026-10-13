---
type: TypeScript Function
title: set
resource: src/test/shared/editorColumnWidths.test.ts#L60-L74
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toProseMirror/buildDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/setColumnWidths
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorColumnWidths/test/tablePos
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

`function set(source: string, widths: (string | undefined)[]): { out: string; state: EditorState }`

# Calls

- [buildDocument](../../../../../../functions/src/shared/editor/toProseMirror/buildDocument.md)
- [setColumnWidths](../../../../../../functions/src/shared/editor/tables/TableCommands/setColumnWidths.md)
- [tablePos](../../../../../../functions/src/test/shared/editorColumnWidths/test/tablePos.md)
- [serializeDocument](../../../../../../functions/src/shared/editor/toSource/serializeDocument.md)
- [readingSignature](../../../../../../functions/src/test/shared/editorHelpers/readingSignature.md)