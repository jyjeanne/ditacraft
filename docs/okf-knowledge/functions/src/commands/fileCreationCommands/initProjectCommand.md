---
type: TypeScript Function
title: initProjectCommand
resource: src/commands/fileCreationCommands.ts#L409-L490
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/commands/fileCreationCommands/getWorkspaceFolder
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/debug
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/promptForFileName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/runProjectInit
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/registerCommands
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function initProjectCommand(): Promise<void>`

# Calls

- [getWorkspaceFolder](../../../../functions/src/commands/fileCreationCommands/getWorkspaceFolder.md)
- [debug](../../../../functions/src/utils/logger/Logger/debug.md)
- [promptForFileName](../../../../functions/src/commands/fileCreationCommands/promptForFileName.md)
- [runProjectInit](../../../../functions/src/commands/fileCreationCommands/runProjectInit.md)

# Called by

- [registerCommands](../../../../functions/src/extension/registerCommands.md)