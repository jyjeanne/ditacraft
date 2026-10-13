---
type: TypeScript Method
title: images
resource: src/editor/visualEditorProvider.ts#L932-L974
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/editor/visualEditorProvider/EditorSession/labels
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/pickFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/askText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/imageFiles/hrefFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/isImagePath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/imageFiles/pastedImageFolder
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/getWorkspaceFolder
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/imageFiles/extensionForMime
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/imageFiles/pastedImageName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/labels/format
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/handle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async images(message: Extract<EditorToHost, { type: 'pickImage' | 'imageFiles' | 'saveImage' }>): Promise<void>`

# Calls

- [labels](../../../../../functions/src/editor/visualEditorProvider/EditorSession/labels.md)
- [pickFile](../../../../../functions/src/editor/visualEditorProvider/EditorSession/pickFile.md)
- [askText](../../../../../functions/src/editor/visualEditorProvider/EditorSession/askText.md)
- [hrefFor](../../../../../functions/src/editor/imageFiles/hrefFor.md)
- [isImagePath](../../../../../functions/src/shared/editor/images/isImagePath.md)
- [pastedImageFolder](../../../../../functions/src/editor/imageFiles/pastedImageFolder.md)
- [getWorkspaceFolder](../../../../../functions/src/commands/fileCreationCommands/getWorkspaceFolder.md)
- [extensionForMime](../../../../../functions/src/editor/imageFiles/extensionForMime.md)
- [pastedImageName](../../../../../functions/src/editor/imageFiles/pastedImageName.md)
- [format](../../../../../functions/src/shared/render/labels/format.md)

# Called by

- [handle](../../../../../functions/src/editor/visualEditorProvider/EditorSession/handle.md)