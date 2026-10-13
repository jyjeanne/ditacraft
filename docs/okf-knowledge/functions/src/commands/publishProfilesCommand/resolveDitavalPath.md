---
type: TypeScript Function
title: resolveDitavalPath
resource: src/commands/publishProfilesCommand.ts#L98-L106
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/commands/previewCommand/pickPreviewFilterCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishCommand/publishCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/followDitavalMoves
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
- [followDitavalMoves](../../../../functions/src/commands/publishProfilesCommand/followDitavalMoves.md)
- [resolveWatchPublishOptions](../../../../functions/src/commands/watchModeCommand/resolveWatchPublishOptions.md)