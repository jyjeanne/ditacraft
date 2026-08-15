---
type: TypeScript Function
title: findNonDirectoryConflicts
resource: src/commands/fileCreationCommands.ts#L619-L629
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/commands/fileCreationCommands/runProjectInit
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function findNonDirectoryConflicts(dirPaths: string[]): Promise<string[]>`

# Called by

- [runProjectInit](../../../../functions/src/commands/fileCreationCommands/runProjectInit.md)