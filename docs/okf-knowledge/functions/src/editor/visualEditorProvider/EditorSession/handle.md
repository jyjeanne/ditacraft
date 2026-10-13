---
type: TypeScript Method
title: handle
resource: src/editor/visualEditorProvider.ts#L676-L786
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/editor/visualEditorProvider/EditorSession/sendInit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/scheduleResolved
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/postSyncState
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/VisualEditorProvider/takeHandoff
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/followPage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/images
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/askText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkPicker/pickLinkTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/linkContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/contextFromRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkPicker/openLinkTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/labels/format
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/labels
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/readText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/VisualEditorProvider/sessionChanged
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/reuse
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/quickFixes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/quickFix
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/pick
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async handle(message: EditorToHost): Promise<void>`

# Calls

- [sendInit](../../../../../functions/src/editor/visualEditorProvider/EditorSession/sendInit.md)
- [scheduleResolved](../../../../../functions/src/editor/visualEditorProvider/EditorSession/scheduleResolved.md)
- [postSyncState](../../../../../functions/src/editor/visualEditorProvider/EditorSession/postSyncState.md)
- [takeHandoff](../../../../../functions/src/editor/visualEditorProvider/VisualEditorProvider/takeHandoff.md)
- [followPage](../../../../../functions/src/editor/visualEditorProvider/EditorSession/followPage.md)
- [images](../../../../../functions/src/editor/visualEditorProvider/EditorSession/images.md)
- [askText](../../../../../functions/src/editor/visualEditorProvider/EditorSession/askText.md)
- [pickLinkTarget](../../../../../functions/src/editor/linkPicker/pickLinkTarget.md)
- [linkContext](../../../../../functions/src/editor/visualEditorProvider/EditorSession/linkContext.md)
- [contextFromRow](../../../../../functions/src/editor/visualEditorProvider/EditorSession/contextFromRow.md)
- [openLinkTarget](../../../../../functions/src/editor/linkPicker/openLinkTarget.md)
- [format](../../../../../functions/src/shared/render/labels/format.md)
- [labels](../../../../../functions/src/editor/visualEditorProvider/EditorSession/labels.md)
- [readText](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/readText.md)
- [sessionChanged](../../../../../functions/src/editor/visualEditorProvider/VisualEditorProvider/sessionChanged.md)
- [reuse](../../../../../functions/src/editor/visualEditorProvider/EditorSession/reuse.md)
- [quickFixes](../../../../../functions/src/editor/visualEditorProvider/EditorSession/quickFixes.md)
- [quickFix](../../../../../functions/src/editor/visualEditorProvider/EditorSession/quickFix.md)
- [pick](../../../../../functions/src/preview/mapContexts/MapContexts/pick.md)