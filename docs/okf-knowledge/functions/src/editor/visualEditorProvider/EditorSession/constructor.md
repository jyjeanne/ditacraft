---
type: TypeScript Method
title: constructor
resource: src/editor/visualEditorProvider.ts#L200-L268
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/editor/visualEditorProvider/EditorSession/html
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/onDocumentChange
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/readsFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/scheduleResolved
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/paths/samePath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/postSyncState
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/followsEditor
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`constructor( private readonly context: vscode.ExtensionContext, readonly document: vscode.TextDocument, private readonly panel: vscode.WebviewPanel, )`

# Calls

- [html](../../../../../functions/src/editor/visualEditorProvider/EditorSession/html.md)
- [onDocumentChange](../../../../../functions/src/editor/visualEditorProvider/EditorSession/onDocumentChange.md)
- [readsFile](../../../../../functions/src/editor/visualEditorProvider/EditorSession/readsFile.md)
- [scheduleResolved](../../../../../functions/src/editor/visualEditorProvider/EditorSession/scheduleResolved.md)
- [samePath](../../../../../functions/src/preview/paths/samePath.md)
- [postSyncState](../../../../../functions/src/editor/visualEditorProvider/EditorSession/postSyncState.md)
- [followsEditor](../../../../../functions/src/editor/visualEditorProvider/EditorSession/followsEditor.md)