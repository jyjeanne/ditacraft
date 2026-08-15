---
type: TypeScript Function
title: promptForFileName
resource: src/commands/fileCreationCommands.ts#L145-L151
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/commands/fileCreationCommands/newTopicCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/newMapCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/newBookmapCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/initProjectCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function promptForFileName(placeholder: string, prompt: string): Promise<string | undefined>`

# Called by

- [newTopicCommand](../../../../functions/src/commands/fileCreationCommands/newTopicCommand.md)
- [newMapCommand](../../../../functions/src/commands/fileCreationCommands/newMapCommand.md)
- [newBookmapCommand](../../../../functions/src/commands/fileCreationCommands/newBookmapCommand.md)
- [initProjectCommand](../../../../functions/src/commands/fileCreationCommands/initProjectCommand.md)