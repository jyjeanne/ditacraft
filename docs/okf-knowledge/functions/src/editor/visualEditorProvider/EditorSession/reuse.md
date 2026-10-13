---
type: TypeScript Method
title: reuse
resource: src/editor/visualEditorProvider.ts#L982-L1031
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/workspaceText/readWorkspaceText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveReuseOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/paths/samePath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/reuseCopy/reuseCopy
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/handle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async reuse(message: Extract<EditorToHost, { type: 'reuse' }>): Promise<void>`

# Calls

- [readWorkspaceText](../../../../../functions/src/preview/workspaceText/readWorkspaceText.md)
- [resolveReuseOf](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveReuseOf.md)
- [samePath](../../../../../functions/src/preview/paths/samePath.md)
- [reuseCopy](../../../../../functions/src/editor/reuseCopy/reuseCopy.md)

# Called by

- [handle](../../../../../functions/src/editor/visualEditorProvider/EditorSession/handle.md)