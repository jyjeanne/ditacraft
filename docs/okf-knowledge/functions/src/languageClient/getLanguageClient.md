---
type: TypeScript Function
title: getLanguageClient
resource: src/languageClient.ts#L69-L71
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/commands/batchMetadataCommand/batchUpdateMetadataCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/findReplaceCommand/findReplaceInFilesCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/inlineConrefCommand/inlineConrefCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/validateCommand/validateViaLsp
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerRootMapFeature
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/sendInitialRootMapSetting
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerMoveTopicFeature
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_fetchSchemeAttributes
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function getLanguageClient(): LanguageClient | undefined`

# Called by

- [batchUpdateMetadataCommand](../../../functions/src/commands/batchMetadataCommand/batchUpdateMetadataCommand.md)
- [findReplaceInFilesCommand](../../../functions/src/commands/findReplaceCommand/findReplaceInFilesCommand.md)
- [inlineConrefCommand](../../../functions/src/commands/inlineConrefCommand/inlineConrefCommand.md)
- [validateViaLsp](../../../functions/src/commands/validateCommand/validateViaLsp.md)
- [registerRootMapFeature](../../../functions/src/extension/registerRootMapFeature.md)
- [sendInitialRootMapSetting](../../../functions/src/extension/sendInitialRootMapSetting.md)
- [registerMoveTopicFeature](../../../functions/src/extension/registerMoveTopicFeature.md)
- [_fetchSchemeAttributes](../../../functions/src/providers/ditavalConditionEditorPanel/DitavalConditionEditorPanel/_fetchSchemeAttributes.md)