---
type: TypeScript Method
title: warn
resource: src/utils/logger.ts#L193-L195
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/customRulesValidator/loadRules
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/customRulesValidator/validateCustomRules
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/createDitaFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/inlineConrefCommand/inlineConrefCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/previewCommand/displayPreview
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishCommand/executePublish
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/validateGuideCommand/executeValidation
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/watchModeCommand/runWatchPublish
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerMoveTopicFeature
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerCommands
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/verifyDitaOtInstallation
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaExplorerProvider/DitaExplorerProvider/getChildren
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_loadCustomCssAsync
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_injectPreviewEnhancementsAsync
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtOutputChannel/DitaOtOutputChannel/logLine
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/loadConfiguration
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/elementNavigator/navigateToElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/doBuildKeySpace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/extractKeyDefinitions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/extractMapReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/log
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public warn(message: string, data?: unknown): void`

# Called by

- [loadRules](../../../../../functions/server/src/features/customRulesValidator/loadRules.md)
- [validateCustomRules](../../../../../functions/server/src/features/customRulesValidator/validateCustomRules.md)
- [createDitaFile](../../../../../functions/src/commands/fileCreationCommands/createDitaFile.md)
- [inlineConrefCommand](../../../../../functions/src/commands/inlineConrefCommand/inlineConrefCommand.md)
- [displayPreview](../../../../../functions/src/commands/previewCommand/displayPreview.md)
- [executePublish](../../../../../functions/src/commands/publishCommand/executePublish.md)
- [executeValidation](../../../../../functions/src/commands/validateGuideCommand/executeValidation.md)
- [runWatchPublish](../../../../../functions/src/commands/watchModeCommand/runWatchPublish.md)
- [registerMoveTopicFeature](../../../../../functions/src/extension/registerMoveTopicFeature.md)
- [registerCommands](../../../../../functions/src/extension/registerCommands.md)
- [verifyDitaOtInstallation](../../../../../functions/src/extension/verifyDitaOtInstallation.md)
- [getChildren](../../../../../functions/src/providers/ditaExplorerProvider/DitaExplorerProvider/getChildren.md)
- [_loadCustomCssAsync](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_loadCustomCssAsync.md)
- [_injectPreviewEnhancementsAsync](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_injectPreviewEnhancementsAsync.md)
- [logLine](../../../../../functions/src/utils/ditaOtOutputChannel/DitaOtOutputChannel/logLine.md)
- [loadConfiguration](../../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/loadConfiguration.md)
- [navigateToElement](../../../../../functions/src/utils/elementNavigator/navigateToElement.md)
- [doBuildKeySpace](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/doBuildKeySpace.md)
- [extractKeyDefinitions](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/extractKeyDefinitions.md)
- [extractMapReferences](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/extractMapReferences.md)
- [log](../../../../../functions/src/utils/logger/Logger/log.md)