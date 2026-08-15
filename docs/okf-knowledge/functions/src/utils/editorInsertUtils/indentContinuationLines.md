---
type: TypeScript Function
title: indentContinuationLines
resource: src/utils/editorInsertUtils.ts#L11-L13
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/commands/insertImageCommand/buildImageSnippet
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/editorInsertUtils/insertAtCursor
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function indentContinuationLines(text: string, indent: string): string`

# Called by

- [buildImageSnippet](../../../../functions/src/commands/insertImageCommand/buildImageSnippet.md)
- [insertAtCursor](../../../../functions/src/utils/editorInsertUtils/insertAtCursor.md)