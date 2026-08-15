---
type: TypeScript Function
title: insertImageCommand
resource: src/commands/insertImageCommand.ts#L50-L95
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/commands/insertImageCommand/resolveImageHref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/insertImageCommand/promptForImageSize
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/insertImageCommand/buildImageSnippet
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/editorInsertUtils/insertAtCursor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/info
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/registerCommands
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function insertImageCommand(): Promise<void>`

# Calls

- [resolveImageHref](../../../../functions/src/commands/insertImageCommand/resolveImageHref.md)
- [promptForImageSize](../../../../functions/src/commands/insertImageCommand/promptForImageSize.md)
- [buildImageSnippet](../../../../functions/src/commands/insertImageCommand/buildImageSnippet.md)
- [insertAtCursor](../../../../functions/src/utils/editorInsertUtils/insertAtCursor.md)
- [info](../../../../functions/src/utils/logger/Logger/info.md)

# Called by

- [registerCommands](../../../../functions/src/extension/registerCommands.md)