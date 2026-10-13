---
type: TypeScript Module
title: mapView
resource: webview/editor/mapView.ts#L1-L776
generated:
  by: okf-rs/0.7.0
relationships:
  imports:
  - target: external/prosemirror-model
    resolved_by: tree-sitter
    confidence: exact
  - target: external/prosemirror-commands
    resolved_by: tree-sitter
    confidence: exact
  - target: external/prosemirror-keymap
    resolved_by: tree-sitter
    confidence: exact
  - target: external/prosemirror-state
    resolved_by: tree-sitter
    confidence: exact
  - target: external/prosemirror-view
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-editor-maps
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-editor-mapcommands
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-editor-reltables
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-editor-reused
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-editor-schema
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-render-labels
    resolved_by: tree-sitter
    confidence: exact
  - target: external/reusedview
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [MapPage](../../../interfaces/webview/editor/mapView/MapPage.md)
- [foldDecoration](../../../functions/webview/editor/mapView/foldDecoration.md)
- [isFolded](../../../functions/webview/editor/mapView/isFolded.md)
- [setFold](../../../functions/webview/editor/mapView/setFold.md)
- [setAllFolds](../../../functions/webview/editor/mapView/setAllFolds.md)
- [foldPaths](../../../functions/webview/editor/mapView/foldPaths.md)
- [restoreFolds](../../../functions/webview/editor/mapView/restoreFolds.md)
- [moveRow](../../../functions/webview/editor/mapView/moveRow.md)
- [visibleRows](../../../functions/webview/editor/mapView/visibleRows.md)
- [selectRow](../../../functions/webview/editor/mapView/selectRow.md)
- [mapPlugin](../../../functions/webview/editor/mapView/mapPlugin.md)
- [editRowLabel](../../../functions/webview/editor/mapView/editRowLabel.md)
- [MapRowView](../../../classes/webview/editor/mapView/MapRowView.md)
- [constructor](../../../functions/webview/editor/mapView/MapRowView/constructor.md)
- [spec](../../../functions/webview/editor/mapView/MapRowView/spec.md)
- [classes](../../../functions/webview/editor/mapView/MapRowView/classes.md)
- [listen](../../../functions/webview/editor/mapView/MapRowView/listen.md)
- [editLabel](../../../functions/webview/editor/mapView/MapRowView/editLabel.md)
- [redraw](../../../functions/webview/editor/mapView/MapRowView/redraw.md)
- [update](../../../functions/webview/editor/mapView/MapRowView/update.md)
- [stopEvent](../../../functions/webview/editor/mapView/MapRowView/stopEvent.md)
- [destroy](../../../functions/webview/editor/mapView/MapRowView/destroy.md)
- [ignoreMutation](../../../functions/webview/editor/mapView/MapRowView/ignoreMutation.md)
- [dropTarget](../../../functions/webview/editor/mapView/dropTarget.md)
- [dropRow](../../../functions/webview/editor/mapView/dropRow.md)
- [RowDrag](../../../classes/webview/editor/mapView/RowDrag.md)
- [constructor](../../../functions/webview/editor/mapView/RowDrag/constructor.md)
- [find](../../../functions/webview/editor/mapView/RowDrag/find.md)
- [end](../../../functions/webview/editor/mapView/RowDrag/end.md)
- [MapCellView](../../../classes/webview/editor/mapView/MapCellView.md)
- [constructor](../../../functions/webview/editor/mapView/MapCellView/constructor.md)
- [own](../../../functions/webview/editor/mapView/MapCellView/own.md)
- [update](../../../functions/webview/editor/mapView/MapCellView/update.md)
- [stopEvent](../../../functions/webview/editor/mapView/MapCellView/stopEvent.md)
- [ignoreMutation](../../../functions/webview/editor/mapView/MapCellView/ignoreMutation.md)
- [mapNodeViews](../../../functions/webview/editor/mapView/mapNodeViews.md)
- [cellAt](../../../functions/webview/editor/mapView/cellAt.md)
- [rowByLabel](../../../functions/webview/editor/mapView/rowByLabel.md)

# Imports

- `prosemirror-model`
- `prosemirror-commands`
- `prosemirror-keymap`
- `prosemirror-state`
- `prosemirror-view`
- `../../src/shared/editor/maps`
- `../../src/shared/editor/mapCommands`
- `../../src/shared/editor/relTables`
- `../../src/shared/editor/reused`
- `../../src/shared/editor/schema`
- `../../src/shared/render/labels`
- `./reusedView`

# Member of

- [ditacraft](../../../packages/ditacraft.md)