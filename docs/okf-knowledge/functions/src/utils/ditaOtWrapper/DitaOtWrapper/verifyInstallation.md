---
type: TypeScript Method
title: verifyInstallation
resource: src/utils/ditaOtWrapper.ts#L290-L318
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/debug
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/previewCommand/initializeAndValidateDitaOt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishCommand/validateAndPrepareForPublish
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/pickTranstype
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/validateGuideCommand/validateGuidePrerequisites
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/watchModeCommand/startWatchModeCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/verifyDitaOtInstallation
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/configureOtPath
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public async verifyInstallation(): Promise<{ installed: boolean; version?: string; path?: string }>`

# Calls

- [debug](../../../../../functions/src/utils/logger/Logger/debug.md)

# Called by

- [initializeAndValidateDitaOt](../../../../../functions/src/commands/previewCommand/initializeAndValidateDitaOt.md)
- [validateAndPrepareForPublish](../../../../../functions/src/commands/publishCommand/validateAndPrepareForPublish.md)
- [pickTranstype](../../../../../functions/src/commands/publishProfilesCommand/pickTranstype.md)
- [validateGuidePrerequisites](../../../../../functions/src/commands/validateGuideCommand/validateGuidePrerequisites.md)
- [startWatchModeCommand](../../../../../functions/src/commands/watchModeCommand/startWatchModeCommand.md)
- [verifyDitaOtInstallation](../../../../../functions/src/extension/verifyDitaOtInstallation.md)
- [configureOtPath](../../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/configureOtPath.md)