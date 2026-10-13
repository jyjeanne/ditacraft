---
type: TypeScript Method
title: quickFixes
resource: src/editor/visualEditorProvider.ts#L589-L620
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/editor/visualEditorProvider/isCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/fixTitle
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/handle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async quickFixes(message: Extract<EditorToHost, { type: 'quickFixes' }>): Promise<void>`

# Calls

- [isCommand](../../../../../functions/src/editor/visualEditorProvider/isCommand.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [fixTitle](../../../../../functions/src/editor/visualEditorProvider/fixTitle.md)

# Called by

- [handle](../../../../../functions/src/editor/visualEditorProvider/EditorSession/handle.md)