---
type: TypeScript Method
title: isMap
resource: src/editor/visualEditorProvider.ts#L852-L854
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/refreshContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/contextFromRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/localMaps
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private isMap(): boolean`

# Called by

- [refreshContext](../../../../../functions/src/editor/visualEditorProvider/EditorSession/refreshContext.md)
- [contextFromRow](../../../../../functions/src/editor/visualEditorProvider/EditorSession/contextFromRow.md)
- [localMaps](../../../../../functions/src/preview/mapContexts/localMaps.md)