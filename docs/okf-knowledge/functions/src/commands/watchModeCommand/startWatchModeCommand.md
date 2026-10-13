---
type: TypeScript Function
title: startWatchModeCommand
resource: src/commands/watchModeCommand.ts#L74-L119
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/watchModeCommand/resolveWatchTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/verifyInstallation
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/watchModeCommand/scheduleRepublish
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/watchModeCommand/setWatchingStatus
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/watchModeCommand/runWatchPublish
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/registerWatchModeFeature
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function startWatchModeCommand(uri?: vscode.Uri): Promise<void>`

# Calls

- [basename](../../../../functions/src/shared/render/toHtml/basename.md)
- [resolveWatchTarget](../../../../functions/src/commands/watchModeCommand/resolveWatchTarget.md)
- [verifyInstallation](../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/verifyInstallation.md)
- [scheduleRepublish](../../../../functions/src/commands/watchModeCommand/scheduleRepublish.md)
- [setWatchingStatus](../../../../functions/src/commands/watchModeCommand/setWatchingStatus.md)
- [runWatchPublish](../../../../functions/src/commands/watchModeCommand/runWatchPublish.md)

# Called by

- [registerWatchModeFeature](../../../../functions/src/extension/registerWatchModeFeature.md)