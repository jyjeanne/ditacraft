---
type: TypeScript Function
title: serializeDocument
resource: src/shared/editor/toSource.ts#L95-L103
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toSource/Writer/lineIndent
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/sourceChange/sourceChangeTransaction
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editor/test/edit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorColumnWidths/test/set
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorCommands/test/run
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorImages/test/apply
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorLinks/test/apply
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorMaps/test/onRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorMenu/test/apply
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorProblems/test/edited
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorQuickFixes/test/fixOnPage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorReuse/test/replaced
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorSourcePositions/test/edited
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorTables/test/run
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/flush
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/cursorOffset
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function serializeDocument(doc: PMNode, base: Base): string`

# Calls

- [lineIndent](../../../../../functions/src/shared/editor/toSource/Writer/lineIndent.md)

# Called by

- [sourceChangeTransaction](../../../../../functions/src/shared/editor/sourceChange/sourceChangeTransaction.md)
- [edit](../../../../../functions/src/test/shared/editor/test/edit.md)
- [set](../../../../../functions/src/test/shared/editorColumnWidths/test/set.md)
- [run](../../../../../functions/src/test/shared/editorCommands/test/run.md)
- [apply](../../../../../functions/src/test/shared/editorImages/test/apply.md)
- [apply](../../../../../functions/src/test/shared/editorLinks/test/apply.md)
- [onRow](../../../../../functions/src/test/shared/editorMaps/test/onRow.md)
- [apply](../../../../../functions/src/test/shared/editorMenu/test/apply.md)
- [edited](../../../../../functions/src/test/shared/editorProblems/test/edited.md)
- [fixOnPage](../../../../../functions/src/test/shared/editorQuickFixes/test/fixOnPage.md)
- [replaced](../../../../../functions/src/test/shared/editorReuse/test/replaced.md)
- [edited](../../../../../functions/src/test/shared/editorSourcePositions/test/edited.md)
- [run](../../../../../functions/src/test/shared/editorTables/test/run.md)
- [flush](../../../../../functions/webview/editor/flush.md)
- [cursorOffset](../../../../../functions/webview/editor/cursorOffset.md)