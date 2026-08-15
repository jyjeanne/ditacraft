---
type: TypeScript Function
title: newMapCommand
resource: src/commands/fileCreationCommands.ts#L293-L336
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/debug
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/getWorkspaceFolder
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/promptForFileName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/resolveTemplatedOrGeneratedContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/getTemplateContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/generateMapContent
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

`async function newMapCommand(): Promise<void>`

# Calls

- [debug](../../../../functions/src/utils/logger/Logger/debug.md)
- [getWorkspaceFolder](../../../../functions/src/commands/fileCreationCommands/getWorkspaceFolder.md)
- [promptForFileName](../../../../functions/src/commands/fileCreationCommands/promptForFileName.md)
- [resolveTemplatedOrGeneratedContent](../../../../functions/src/commands/fileCreationCommands/resolveTemplatedOrGeneratedContent.md)
- [getTemplateContext](../../../../functions/src/commands/fileCreationCommands/getTemplateContext.md)
- [generateMapContent](../../../../functions/src/commands/fileCreationCommands/generateMapContent.md)
- [createDitaFile](../../../../functions/src/commands/fileCreationCommands/createDitaFile.md)

# Called by

- [registerCommands](../../../../functions/src/extension/registerCommands.md)