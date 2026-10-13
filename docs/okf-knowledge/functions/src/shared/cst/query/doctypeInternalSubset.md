---
type: TypeScript Function
title: doctypeInternalSubset
resource: src/shared/cst/query.ts#L86-L95
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/postResolved
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/select
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editor/test/load
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/build
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/replaceWithCopy
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function doctypeInternalSubset(doc: Document): string | undefined`

# Calls

- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [postResolved](../../../../../functions/src/editor/visualEditorProvider/EditorSession/postResolved.md)
- [select](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/select.md)
- [load](../../../../../functions/src/test/shared/editor/test/load.md)
- [build](../../../../../functions/webview/editor/build.md)
- [replaceWithCopy](../../../../../functions/webview/editor/replaceWithCopy.md)