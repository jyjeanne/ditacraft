---
type: TypeScript Function
title: getWorkspaceFolder
resource: src/commands/fileCreationCommands.ts#L57-L64
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/commands/fileCreationCommands/createDitaFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/newTopicCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/newMapCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/newBookmapCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/initProjectCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/insertImageCommand/resolveImageHref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkPicker/candidateFiles
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/resourceRoots
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/customCssPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/images
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarOptions/externalCatalog
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/loadMaps
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/resourceRoots
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/customCssPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/externalCatalog
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/workspaceText/readWorkspaceText
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function getWorkspaceFolder(): vscode.WorkspaceFolder | undefined`

# Called by

- [createDitaFile](../../../../functions/src/commands/fileCreationCommands/createDitaFile.md)
- [newTopicCommand](../../../../functions/src/commands/fileCreationCommands/newTopicCommand.md)
- [newMapCommand](../../../../functions/src/commands/fileCreationCommands/newMapCommand.md)
- [newBookmapCommand](../../../../functions/src/commands/fileCreationCommands/newBookmapCommand.md)
- [initProjectCommand](../../../../functions/src/commands/fileCreationCommands/initProjectCommand.md)
- [resolveImageHref](../../../../functions/src/commands/insertImageCommand/resolveImageHref.md)
- [candidateFiles](../../../../functions/src/editor/linkPicker/candidateFiles.md)
- [resourceRoots](../../../../functions/src/editor/visualEditorProvider/EditorSession/resourceRoots.md)
- [customCssPath](../../../../functions/src/editor/visualEditorProvider/EditorSession/customCssPath.md)
- [images](../../../../functions/src/editor/visualEditorProvider/EditorSession/images.md)
- [externalCatalog](../../../../functions/src/preview/grammarOptions/externalCatalog.md)
- [loadMaps](../../../../functions/src/preview/mapContexts/MapContexts/loadMaps.md)
- [resourceRoots](../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/resourceRoots.md)
- [customCssPath](../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/customCssPath.md)
- [externalCatalog](../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/externalCatalog.md)
- [readWorkspaceText](../../../../functions/src/preview/workspaceText/readWorkspaceText.md)