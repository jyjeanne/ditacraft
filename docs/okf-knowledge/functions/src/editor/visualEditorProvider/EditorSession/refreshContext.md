---
type: TypeScript Method
title: refreshContext
resource: src/editor/visualEditorProvider.ts#L862-L886
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/editor/visualEditorProvider/EditorSession/isMap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/contextOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/scripts/screenshots/key
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/labels
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/placeLabel
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/scheduleResolved
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private refreshContext(force = false): void`

# Calls

- [isMap](../../../../../functions/src/editor/visualEditorProvider/EditorSession/isMap.md)
- [contextOf](../../../../../functions/src/preview/mapContexts/MapContexts/contextOf.md)
- [key](../../../../../functions/scripts/screenshots/key.md)
- [labels](../../../../../functions/src/editor/visualEditorProvider/EditorSession/labels.md)
- [placeLabel](../../../../../functions/src/preview/mapContext/placeLabel.md)
- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)
- [scheduleResolved](../../../../../functions/src/editor/visualEditorProvider/EditorSession/scheduleResolved.md)