---
type: TypeScript Function
title: buildDocument
resource: src/shared/editor/toProseMirror.ts#L626-L648
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/query/rootElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/block
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/detectIndentUnit
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/test/shared/editor/test/load
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorColumnWidths/test/set
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorCommands/test/run
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorImages/test/at
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorImages/test/apply
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorLinks/test/at
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorLinks/test/apply
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorMaps/test/rowsOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorMaps/test/onRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorMenu/test/stateAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorMenu/test/apply
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorProblems/test/edited
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorProblems/test/marksFor
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
  - target: functions/webview/editor/build
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function buildDocument(cst: Document, es: EditorSchema, options: { entity?: EntityLookup } = {}): BuildResult`

# Calls

- [rootElement](../../../../../functions/src/shared/cst/query/rootElement.md)
- [block](../../../../../functions/src/shared/editor/toProseMirror/Builder/block.md)
- [detectIndentUnit](../../../../../functions/src/shared/editor/toProseMirror/detectIndentUnit.md)

# Called by

- [load](../../../../../functions/src/test/shared/editor/test/load.md)
- [set](../../../../../functions/src/test/shared/editorColumnWidths/test/set.md)
- [run](../../../../../functions/src/test/shared/editorCommands/test/run.md)
- [at](../../../../../functions/src/test/shared/editorImages/test/at.md)
- [apply](../../../../../functions/src/test/shared/editorImages/test/apply.md)
- [at](../../../../../functions/src/test/shared/editorLinks/test/at.md)
- [apply](../../../../../functions/src/test/shared/editorLinks/test/apply.md)
- [rowsOf](../../../../../functions/src/test/shared/editorMaps/test/rowsOf.md)
- [onRow](../../../../../functions/src/test/shared/editorMaps/test/onRow.md)
- [stateAt](../../../../../functions/src/test/shared/editorMenu/test/stateAt.md)
- [apply](../../../../../functions/src/test/shared/editorMenu/test/apply.md)
- [edited](../../../../../functions/src/test/shared/editorProblems/test/edited.md)
- [marksFor](../../../../../functions/src/test/shared/editorProblems/test/marksFor.md)
- [replaced](../../../../../functions/src/test/shared/editorReuse/test/replaced.md)
- [edited](../../../../../functions/src/test/shared/editorSourcePositions/test/edited.md)
- [run](../../../../../functions/src/test/shared/editorTables/test/run.md)
- [build](../../../../../functions/webview/editor/build.md)