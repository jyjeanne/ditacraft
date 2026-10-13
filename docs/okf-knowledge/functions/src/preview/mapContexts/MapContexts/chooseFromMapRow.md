---
type: TypeScript Method
title: chooseFromMapRow
resource: src/preview/mapContexts.ts#L204-L224
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/sharedRegistry/sharedGrammarRegistry
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/select
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/occurrenceAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/keyOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/places
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/same
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/contextFromRow
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async chooseFromMapRow(topicPath: string, mapPath: string, mapText: string, offset: number): Promise<void>`

# Calls

- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [sharedGrammarRegistry](../../../../../functions/src/preview/sharedRegistry/sharedGrammarRegistry.md)
- [select](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/select.md)
- [occurrenceAt](../../../../../functions/src/preview/mapContext/occurrenceAt.md)
- [keyOf](../../../../../functions/src/preview/mapContexts/MapContexts/keyOf.md)
- [places](../../../../../functions/src/preview/mapContexts/MapContexts/places.md)
- [same](../../../../../functions/src/preview/mapContext/same.md)

# Called by

- [contextFromRow](../../../../../functions/src/editor/visualEditorProvider/EditorSession/contextFromRow.md)