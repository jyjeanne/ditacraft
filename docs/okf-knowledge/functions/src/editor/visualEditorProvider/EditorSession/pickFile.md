---
type: TypeScript Method
title: pickFile
resource: src/editor/visualEditorProvider.ts#L915-L926
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/editor/visualEditorProvider/EditorSession/labels
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/images
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async pickFile(title: string, near: vscode.Uri): Promise<string | undefined>`

# Calls

- [labels](../../../../../functions/src/editor/visualEditorProvider/EditorSession/labels.md)

# Called by

- [images](../../../../../functions/src/editor/visualEditorProvider/EditorSession/images.md)