---
type: TypeScript Method
title: getOutputDirectory
resource: src/utils/ditaOtWrapper.ts#L735-L737
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/commands/previewCommand/generateHtml5OutputIfNeeded
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishCommand/executePublish
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/watchModeCommand/runWatchPublish
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public getOutputDirectory(): string`

# Called by

- [generateHtml5OutputIfNeeded](../../../../../functions/src/commands/previewCommand/generateHtml5OutputIfNeeded.md)
- [executePublish](../../../../../functions/src/commands/publishCommand/executePublish.md)
- [runWatchPublish](../../../../../functions/src/commands/watchModeCommand/runWatchPublish.md)