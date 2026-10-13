---
type: TypeScript Function
title: stopWatchModeCommand
resource: src/commands/watchModeCommand.ts#L124-L137
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/basename
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

- [basename](../../../../functions/src/shared/render/toHtml/basename.md)

# Called by

- [registerWatchModeFeature](../../../../functions/src/extension/registerWatchModeFeature.md)