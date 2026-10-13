---
type: TypeScript Method
title: askText
resource: src/editor/visualEditorProvider.ts#L907-L913
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/handle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/images
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async askText(prompt: string, value: string, placeHolder?: string): Promise<string | undefined>`

# Called by

- [handle](../../../../../functions/src/editor/visualEditorProvider/EditorSession/handle.md)
- [images](../../../../../functions/src/editor/visualEditorProvider/EditorSession/images.md)