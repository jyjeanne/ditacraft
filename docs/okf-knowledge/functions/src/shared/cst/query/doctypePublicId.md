---
type: TypeScript Function
title: doctypePublicId
resource: src/shared/cst/query.ts#L75-L83
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/grammarKeyOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/select
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function doctypePublicId(doc: Document): string | undefined`

# Calls

- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [grammarKeyOf](../../../../../functions/src/editor/visualEditorProvider/EditorSession/grammarKeyOf.md)
- [select](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/select.md)