---
type: TypeScript Function
title: newBookmapCommand
resource: src/commands/fileCreationCommands.ts#L349-L403
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/commands/fileCreationCommands/getWorkspaceFolder
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/promptForFileName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/resolveTemplatedOrGeneratedContentWithTitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/getTemplateContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/generateBookmapContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/createDitaFile
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/registerCommands
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function newBookmapCommand(): Promise<void>`

# Calls

- [getWorkspaceFolder](../../../../functions/src/commands/fileCreationCommands/getWorkspaceFolder.md)
- [promptForFileName](../../../../functions/src/commands/fileCreationCommands/promptForFileName.md)
- [resolveTemplatedOrGeneratedContentWithTitle](../../../../functions/src/commands/fileCreationCommands/resolveTemplatedOrGeneratedContentWithTitle.md)
- [getTemplateContext](../../../../functions/src/commands/fileCreationCommands/getTemplateContext.md)
- [generateBookmapContent](../../../../functions/src/commands/fileCreationCommands/generateBookmapContent.md)
- [createDitaFile](../../../../functions/src/commands/fileCreationCommands/createDitaFile.md)

# Called by

- [registerCommands](../../../../functions/src/extension/registerCommands.md)