---
type: TypeScript Function
title: registerWatchModeFeature
resource: src/extension.ts#L707-L729
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/commands/watchModeCommand/startWatchModeCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/watchModeCommand/stopWatchModeCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/watchModeCommand/disposeWatchMode
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function registerWatchModeFeature(context: vscode.ExtensionContext): void`

# Calls

- [startWatchModeCommand](../../../functions/src/commands/watchModeCommand/startWatchModeCommand.md)
- [stopWatchModeCommand](../../../functions/src/commands/watchModeCommand/stopWatchModeCommand.md)
- [disposeWatchMode](../../../functions/src/commands/watchModeCommand/disposeWatchMode.md)

# Called by

- [activate](../../../functions/src/extension/activate.md)