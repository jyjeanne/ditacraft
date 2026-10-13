---
type: TypeScript Function
title: findNonDirectoryConflicts
resource: src/commands/fileCreationCommands.ts#L626-L636
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/features/moveTopic/isDirectory
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/fileCreationCommands/runProjectInit
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function findNonDirectoryConflicts(dirPaths: string[]): Promise<string[]>`

# Calls

- [isDirectory](../../../../functions/server/src/features/moveTopic/isDirectory.md)

# Called by

- [runProjectInit](../../../../functions/src/commands/fileCreationCommands/runProjectInit.md)