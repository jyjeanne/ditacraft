---
type: TypeScript Function
title: flashStatus
resource: src/commands/watchModeCommand.ts#L319-L330
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/commands/watchModeCommand/setWatchingStatus
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/watchModeCommand/runWatchPublish
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function flashStatus(text: string, tooltip: string): void`

# Calls

- [setWatchingStatus](../../../../functions/src/commands/watchModeCommand/setWatchingStatus.md)

# Called by

- [runWatchPublish](../../../../functions/src/commands/watchModeCommand/runWatchPublish.md)