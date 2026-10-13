---
type: TypeScript Function
title: sourceChangeTransaction
resource: src/shared/editor/sourceChange.ts#L286-L316
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/sourceChange/applyTextEdits
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/sourceChange/editedSpan
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/sourceChange/sourceChange
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/serializeDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/sourceChange/sameReading
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/sourceChange/changedSize
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/test/shared/editorQuickFixes/test/fixOnPage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/makeQuickFix
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function sourceChangeTransaction(state: EditorState, fresh: BuildResult, edits: readonly TextEdit[], es: EditorSchema, base: Base, buildText: (text: string) => BuildResult): Transaction | undefined`

# Calls

- [applyTextEdits](../../../../../functions/src/shared/editor/sourceChange/applyTextEdits.md)
- [editedSpan](../../../../../functions/src/shared/editor/sourceChange/editedSpan.md)
- [sourceChange](../../../../../functions/src/shared/editor/sourceChange/sourceChange.md)
- [serializeDocument](../../../../../functions/src/shared/editor/toSource/serializeDocument.md)
- [sameReading](../../../../../functions/src/shared/editor/sourceChange/sameReading.md)
- [changedSize](../../../../../functions/src/shared/editor/sourceChange/changedSize.md)

# Called by

- [fixOnPage](../../../../../functions/src/test/shared/editorQuickFixes/test/fixOnPage.md)
- [makeQuickFix](../../../../../functions/webview/editor/makeQuickFix.md)