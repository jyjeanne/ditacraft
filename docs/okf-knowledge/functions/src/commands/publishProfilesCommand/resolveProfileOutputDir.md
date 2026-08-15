---
type: TypeScript Function
title: resolveProfileOutputDir
resource: src/commands/publishProfilesCommand.ts#L81-L84
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/pathUtils/substituteWorkspaceFolderVar
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/publishCommand/publishCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/watchModeCommand/resolveWatchPublishOptions
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function resolveProfileOutputDir(outputDir: string | undefined): string | undefined`

# Calls

- [substituteWorkspaceFolderVar](../../../../functions/src/utils/pathUtils/substituteWorkspaceFolderVar.md)

# Called by

- [publishCommand](../../../../functions/src/commands/publishCommand/publishCommand.md)
- [resolveWatchPublishOptions](../../../../functions/src/commands/watchModeCommand/resolveWatchPublishOptions.md)