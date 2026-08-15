---
type: TypeScript Function
title: createDitaFile
resource: src/commands/fileCreationCommands.ts#L100-L140
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
  - target: functions/src/utils/logger/Logger/warn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/info
    resolved_by: tree-sitter
    confidence: exact
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
---

# Signature

`async function createDitaFile(options: FileCreationOptions): Promise<void>`

# Calls

- [getWorkspaceFolder](../../../../functions/src/commands/fileCreationCommands/getWorkspaceFolder.md)
- [debug](../../../../functions/src/utils/logger/Logger/debug.md)
- [warn](../../../../functions/src/utils/logger/Logger/warn.md)
- [info](../../../../functions/src/utils/logger/Logger/info.md)

# Called by

- [newTopicCommand](../../../../functions/src/commands/fileCreationCommands/newTopicCommand.md)
- [newMapCommand](../../../../functions/src/commands/fileCreationCommands/newMapCommand.md)
- [newBookmapCommand](../../../../functions/src/commands/fileCreationCommands/newBookmapCommand.md)