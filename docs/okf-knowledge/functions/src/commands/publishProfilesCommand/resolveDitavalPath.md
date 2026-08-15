---
type: TypeScript Function
title: resolveDitavalPath
resource: src/commands/publishProfilesCommand.ts#L59-L67
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/commands/previewCommand/pickPreviewFilterCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishCommand/publishCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/watchModeCommand/resolveWatchPublishOptions
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function resolveDitavalPath(ditavalPath: string | undefined): string | undefined`

# Called by

- [pickPreviewFilterCommand](../../../../functions/src/commands/previewCommand/pickPreviewFilterCommand.md)
- [publishCommand](../../../../functions/src/commands/publishCommand/publishCommand.md)
- [resolveWatchPublishOptions](../../../../functions/src/commands/watchModeCommand/resolveWatchPublishOptions.md)