---
type: TypeScript Function
title: registerCommands
resource: src/extension.ts#L804-L1107
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/commands/validateCommand/validateCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishCommand/publishCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/toggleLock
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/VisualEditorProvider/handoff
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/VisualEditorProvider/debugMessage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/VisualEditorProvider/debugPost
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/VisualEditorProvider/queueDialogAnswer
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/properties/propertiesView/revealPropertiesView
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/activeTopicUri
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/pick
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/properties/propertiesView/PropertiesViewProvider/debugAction
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
  - target: functions/src/commands/insertImageCommand/insertImageCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/insertTableCommand/insertTableCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/initProjectCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/findReplaceCommand/findReplaceInFilesCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/batchMetadataCommand/batchUpdateMetadataCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/ditavalConditionEditorCommand/editDitavalConditionsCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/extractTopicCommand/extractTopicFromSectionCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/inlineConrefCommand/inlineConrefCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/cspellSetupCommand/setupCSpellCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtOutputChannel/getDitaOtOutputChannel
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/validateGuideCommand/validateGuideCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/warn
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function registerCommands(context: vscode.ExtensionContext): void`

# Calls

- [validateCommand](../../../functions/src/commands/validateCommand/validateCommand.md)
- [publishCommand](../../../functions/src/commands/publishCommand/publishCommand.md)
- [toggleLock](../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/toggleLock.md)
- [find](../../../functions/webview/editor/mapView/RowDrag/find.md)
- [handoff](../../../functions/src/editor/visualEditorProvider/VisualEditorProvider/handoff.md)
- [debugMessage](../../../functions/src/editor/visualEditorProvider/VisualEditorProvider/debugMessage.md)
- [debugPost](../../../functions/src/editor/visualEditorProvider/VisualEditorProvider/debugPost.md)
- [queueDialogAnswer](../../../functions/src/editor/visualEditorProvider/VisualEditorProvider/queueDialogAnswer.md)
- [revealPropertiesView](../../../functions/src/properties/propertiesView/revealPropertiesView.md)
- [activeTopicUri](../../../functions/src/extension/activeTopicUri.md)
- [pick](../../../functions/src/preview/mapContexts/MapContexts/pick.md)
- [debugAction](../../../functions/src/properties/propertiesView/PropertiesViewProvider/debugAction.md)
- [newTopicCommand](../../../functions/src/commands/fileCreationCommands/newTopicCommand.md)
- [newMapCommand](../../../functions/src/commands/fileCreationCommands/newMapCommand.md)
- [newBookmapCommand](../../../functions/src/commands/fileCreationCommands/newBookmapCommand.md)
- [insertImageCommand](../../../functions/src/commands/insertImageCommand/insertImageCommand.md)
- [insertTableCommand](../../../functions/src/commands/insertTableCommand/insertTableCommand.md)
- [initProjectCommand](../../../functions/src/commands/fileCreationCommands/initProjectCommand.md)
- [findReplaceInFilesCommand](../../../functions/src/commands/findReplaceCommand/findReplaceInFilesCommand.md)
- [batchUpdateMetadataCommand](../../../functions/src/commands/batchMetadataCommand/batchUpdateMetadataCommand.md)
- [editDitavalConditionsCommand](../../../functions/src/commands/ditavalConditionEditorCommand/editDitavalConditionsCommand.md)
- [extractTopicFromSectionCommand](../../../functions/src/commands/extractTopicCommand/extractTopicFromSectionCommand.md)
- [inlineConrefCommand](../../../functions/src/commands/inlineConrefCommand/inlineConrefCommand.md)
- [setupCSpellCommand](../../../functions/src/commands/cspellSetupCommand/setupCSpellCommand.md)
- [getDitaOtOutputChannel](../../../functions/src/utils/ditaOtOutputChannel/getDitaOtOutputChannel.md)
- [validateGuideCommand](../../../functions/src/commands/validateGuideCommand/validateGuideCommand.md)
- [warn](../../../functions/src/utils/logger/Logger/warn.md)

# Called by

- [activate](../../../functions/src/extension/activate.md)