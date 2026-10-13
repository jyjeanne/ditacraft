---
type: TypeScript Function
title: pickLinkTarget
resource: src/editor/linkPicker.ts#L209-L251
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/editor/linkPicker/tokensFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkTargets/targetsInDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkTargets/pickItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkPicker/keyTargets
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkPicker/fileTargets
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkTargets/webLink
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkPicker/askWebAddress
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/imageFiles/hrefFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkTargets/fileItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/labels/format
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/handle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function pickLinkTarget(ctx: LinkPickerContext, current?: LinkTarget, mode?: 'map'): Promise<LinkTarget | undefined>`

# Calls

- [tokensFor](../../../../functions/src/editor/linkPicker/tokensFor.md)
- [targetsInDocument](../../../../functions/src/editor/linkTargets/targetsInDocument.md)
- [pickItems](../../../../functions/src/editor/linkTargets/pickItems.md)
- [keyTargets](../../../../functions/src/editor/linkPicker/keyTargets.md)
- [fileTargets](../../../../functions/src/editor/linkPicker/fileTargets.md)
- [webLink](../../../../functions/src/editor/linkTargets/webLink.md)
- [askWebAddress](../../../../functions/src/editor/linkPicker/askWebAddress.md)
- [find](../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [hrefFor](../../../../functions/src/editor/imageFiles/hrefFor.md)
- [fileItems](../../../../functions/src/editor/linkTargets/fileItems.md)
- [format](../../../../functions/src/shared/render/labels/format.md)
- [basename](../../../../functions/src/shared/render/toHtml/basename.md)

# Called by

- [handle](../../../../functions/src/editor/visualEditorProvider/EditorSession/handle.md)