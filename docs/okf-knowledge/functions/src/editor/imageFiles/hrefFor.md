---
type: TypeScript Function
title: hrefFor
resource: src/editor/imageFiles.ts#L16-L22
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/editor/linkPicker/pickLinkTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkTargets/fileLink
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkTargets/pickItems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/images
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function hrefFor(fromDoc: string, file: string): string`

# Called by

- [pickLinkTarget](../../../../functions/src/editor/linkPicker/pickLinkTarget.md)
- [fileLink](../../../../functions/src/editor/linkTargets/fileLink.md)
- [pickItems](../../../../functions/src/editor/linkTargets/pickItems.md)
- [images](../../../../functions/src/editor/visualEditorProvider/EditorSession/images.md)