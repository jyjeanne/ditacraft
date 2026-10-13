---
type: TypeScript Function
title: generateBookmapContent
resource: src/commands/fileCreationCommands.ts#L835-L866
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/commands/fileCreationCommands/todayIso
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/fileCreationCommands/newBookmapCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function generateBookmapContent(title: string, id: string): string`

# Calls

- [todayIso](../../../../functions/src/commands/fileCreationCommands/todayIso.md)

# Called by

- [newBookmapCommand](../../../../functions/src/commands/fileCreationCommands/newBookmapCommand.md)