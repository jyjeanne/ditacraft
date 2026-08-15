---
type: TypeScript Function
title: resolveWatchTarget
resource: src/commands/watchModeCommand.ts#L163-L188
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/watchModeCommand/resolveWatchPublishOptions
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/watchModeCommand/startWatchModeCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function resolveWatchTarget(uri?: vscode.Uri): Promise<WatchTarget | undefined>`

# Calls

- [getConfiguration](../../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)
- [get](../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [resolveWatchPublishOptions](../../../../functions/src/commands/watchModeCommand/resolveWatchPublishOptions.md)

# Called by

- [startWatchModeCommand](../../../../functions/src/commands/watchModeCommand/startWatchModeCommand.md)