---
type: TypeScript Method
title: select
resource: src/preview/grammarRegistry.ts#L67-L106
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/html/internalSubsetEntities
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/doctypeInternalSubset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/doctypePublicId
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/rootElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/fromExternalCatalog
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/byPublicId
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/labelOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/versionFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/sendInit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/loadMaps
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/chooseFromMapRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/properties/propertiesView/PropertiesViewProvider/parse
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/MapRowView/editLabel
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/MapCellView/constructor
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`select(doc: Document, options: SelectOptions = {}): SelectedGrammar`

# Calls

- [internalSubsetEntities](../../../../../functions/src/shared/render/html/internalSubsetEntities.md)
- [doctypeInternalSubset](../../../../../functions/src/shared/cst/query/doctypeInternalSubset.md)
- [doctypePublicId](../../../../../functions/src/shared/cst/query/doctypePublicId.md)
- [rootElement](../../../../../functions/src/shared/cst/query/rootElement.md)
- [fromExternalCatalog](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/fromExternalCatalog.md)
- [byPublicId](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/byPublicId.md)
- [labelOf](../../../../../functions/src/preview/grammarRegistry/labelOf.md)
- [versionFor](../../../../../functions/src/preview/grammarRegistry/versionFor.md)
- [entries](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)
- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)

# Called by

- [sendInit](../../../../../functions/src/editor/visualEditorProvider/EditorSession/sendInit.md)
- [loadMaps](../../../../../functions/src/preview/mapContexts/MapContexts/loadMaps.md)
- [chooseFromMapRow](../../../../../functions/src/preview/mapContexts/MapContexts/chooseFromMapRow.md)
- [renderNow](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/renderNow.md)
- [parse](../../../../../functions/src/properties/propertiesView/PropertiesViewProvider/parse.md)
- [editLabel](../../../../../functions/webview/editor/mapView/MapRowView/editLabel.md)
- [constructor](../../../../../functions/webview/editor/mapView/MapCellView/constructor.md)