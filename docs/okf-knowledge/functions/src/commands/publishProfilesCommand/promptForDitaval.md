---
type: TypeScript Function
title: promptForDitaval
resource: src/commands/publishProfilesCommand.ts#L230-L263
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/commands/publishProfilesCommand/storeDitavalPath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/previewCommand/pickPreviewFilterCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/promptForProfile
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function promptForDitaval(existingPath?: string): Promise<string | undefined>`

# Calls

- [storeDitavalPath](../../../../functions/src/commands/publishProfilesCommand/storeDitavalPath.md)

# Called by

- [pickPreviewFilterCommand](../../../../functions/src/commands/previewCommand/pickPreviewFilterCommand.md)
- [promptForProfile](../../../../functions/src/commands/publishProfilesCommand/promptForProfile.md)