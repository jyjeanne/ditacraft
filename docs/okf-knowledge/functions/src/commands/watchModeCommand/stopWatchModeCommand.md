---
type: TypeScript Function
title: stopWatchModeCommand
resource: src/commands/watchModeCommand.ts#L124-L137
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/info
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/registerWatchModeFeature
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function stopWatchModeCommand(): void`

# Calls

- [info](../../../../functions/src/utils/logger/Logger/info.md)

# Called by

- [registerWatchModeFeature](../../../../functions/src/extension/registerWatchModeFeature.md)