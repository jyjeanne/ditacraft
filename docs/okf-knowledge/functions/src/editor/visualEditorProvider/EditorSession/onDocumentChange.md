---
type: TypeScript Method
title: onDocumentChange
resource: src/editor/visualEditorProvider.ts#L810-L825
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/editor/visualEditorProvider/EditorSession/grammarKeyOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/sendInit
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/constructor
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private onDocumentChange(e: vscode.TextDocumentChangeEvent): void`

# Calls

- [grammarKeyOf](../../../../../functions/src/editor/visualEditorProvider/EditorSession/grammarKeyOf.md)
- [sendInit](../../../../../functions/src/editor/visualEditorProvider/EditorSession/sendInit.md)

# Called by

- [constructor](../../../../../functions/src/editor/visualEditorProvider/EditorSession/constructor.md)