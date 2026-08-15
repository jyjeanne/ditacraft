---
type: TypeScript Function
title: getWorkspaceFolder
resource: src/commands/fileCreationCommands.ts#L57-L64
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/commands/fileCreationCommands/createDitaFile
    resolved_by: tree-sitter
    confidence: exact
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
  - target: functions/src/commands/insertImageCommand/resolveImageHref
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function getWorkspaceFolder(): vscode.WorkspaceFolder | undefined`

# Called by

- [createDitaFile](../../../../functions/src/commands/fileCreationCommands/createDitaFile.md)
- [newTopicCommand](../../../../functions/src/commands/fileCreationCommands/newTopicCommand.md)
- [newMapCommand](../../../../functions/src/commands/fileCreationCommands/newMapCommand.md)
- [newBookmapCommand](../../../../functions/src/commands/fileCreationCommands/newBookmapCommand.md)
- [initProjectCommand](../../../../functions/src/commands/fileCreationCommands/initProjectCommand.md)
- [resolveImageHref](../../../../functions/src/commands/insertImageCommand/resolveImageHref.md)