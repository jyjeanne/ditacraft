---
type: TypeScript Method
title: labels
resource: src/editor/visualEditorProvider.ts#L829-L831
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/labels/labelsFor
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/handle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/linkContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/refreshContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/pickFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/images
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private labels(): Record<string, string>`

# Calls

- [labelsFor](../../../../../functions/src/shared/render/labels/labelsFor.md)

# Called by

- [handle](../../../../../functions/src/editor/visualEditorProvider/EditorSession/handle.md)
- [linkContext](../../../../../functions/src/editor/visualEditorProvider/EditorSession/linkContext.md)
- [refreshContext](../../../../../functions/src/editor/visualEditorProvider/EditorSession/refreshContext.md)
- [pickFile](../../../../../functions/src/editor/visualEditorProvider/EditorSession/pickFile.md)
- [images](../../../../../functions/src/editor/visualEditorProvider/EditorSession/images.md)