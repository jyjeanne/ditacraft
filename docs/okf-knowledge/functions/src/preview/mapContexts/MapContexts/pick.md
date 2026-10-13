---
type: TypeScript Method
title: pick
resource: src/preview/mapContexts.ts#L227-L251
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/labels/labelsFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/places
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/contextOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/placeLabel
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/handle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerCommands
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/runCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/mapRowInfo
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorMaps/test/onRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/properties/test/rewrite
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async pick(topicPath: string): Promise<void>`

# Calls

- [labelsFor](../../../../../functions/src/shared/render/labels/labelsFor.md)
- [places](../../../../../functions/src/preview/mapContexts/MapContexts/places.md)
- [contextOf](../../../../../functions/src/preview/mapContexts/MapContexts/contextOf.md)
- [placeLabel](../../../../../functions/src/preview/mapContext/placeLabel.md)
- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)

# Called by

- [handle](../../../../../functions/src/editor/visualEditorProvider/EditorSession/handle.md)
- [registerCommands](../../../../../functions/src/extension/registerCommands.md)
- [runCommand](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/runCommand.md)
- [mapRowInfo](../../../../../functions/src/shared/editor/maps/mapRowInfo.md)
- [onRow](../../../../../functions/src/test/shared/editorMaps/test/onRow.md)
- [rewrite](../../../../../functions/src/test/shared/properties/test/rewrite.md)