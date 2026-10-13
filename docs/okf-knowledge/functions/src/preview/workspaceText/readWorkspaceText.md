---
type: TypeScript Function
title: readWorkspaceText
resource: src/preview/workspaceText.ts#L15-L31
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/commands/fileCreationCommands/getWorkspaceFolder
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/paths/isInside
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/paths/realPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/paths/samePath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/readFile
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/linkPicker/load
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/postResolved
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/reuse
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/loadMaps
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/readText
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function readWorkspaceText(filePath: string, context: vscode.Uri | undefined): Promise<string | null>`

# Calls

- [getWorkspaceFolder](../../../../functions/src/commands/fileCreationCommands/getWorkspaceFolder.md)
- [isInside](../../../../functions/src/preview/paths/isInside.md)
- [realPath](../../../../functions/src/preview/paths/realPath.md)
- [find](../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [samePath](../../../../functions/src/preview/paths/samePath.md)
- [readFile](../../../../functions/webview/editor/readFile.md)

# Called by

- [load](../../../../functions/src/editor/linkPicker/load.md)
- [postResolved](../../../../functions/src/editor/visualEditorProvider/EditorSession/postResolved.md)
- [reuse](../../../../functions/src/editor/visualEditorProvider/EditorSession/reuse.md)
- [loadMaps](../../../../functions/src/preview/mapContexts/MapContexts/loadMaps.md)
- [readText](../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/readText.md)