---
type: TypeScript Function
title: scheduleRepublish
resource: src/commands/watchModeCommand.ts#L149-L156
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/commands/watchModeCommand/runWatchPublish
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/watchModeCommand/startWatchModeCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function scheduleRepublish(): void`

# Calls

- [runWatchPublish](../../../../functions/src/commands/watchModeCommand/runWatchPublish.md)

# Called by

- [startWatchModeCommand](../../../../functions/src/commands/watchModeCommand/startWatchModeCommand.md)