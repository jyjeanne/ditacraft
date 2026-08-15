---
type: TypeScript Function
title: humanizeFileName
resource: src/commands/fileCreationCommands.ts#L88-L94
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/commands/fileCreationCommands/resolveTemplatedOrGeneratedContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/runProjectInit
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function humanizeFileName(fileName: string): string`

# Called by

- [resolveTemplatedOrGeneratedContent](../../../../functions/src/commands/fileCreationCommands/resolveTemplatedOrGeneratedContent.md)
- [runProjectInit](../../../../functions/src/commands/fileCreationCommands/runProjectInit.md)