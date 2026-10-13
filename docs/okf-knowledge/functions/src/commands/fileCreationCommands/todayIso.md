---
type: TypeScript Function
title: todayIso
resource: src/commands/fileCreationCommands.ts#L89-L92
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/commands/fileCreationCommands/resolveTemplatedOrGeneratedContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/resolveTemplatedOrGeneratedContentWithTitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/runProjectInit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/generateBookmapContent
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function todayIso(now: Date = new Date()): string`

# Called by

- [resolveTemplatedOrGeneratedContent](../../../../functions/src/commands/fileCreationCommands/resolveTemplatedOrGeneratedContent.md)
- [resolveTemplatedOrGeneratedContentWithTitle](../../../../functions/src/commands/fileCreationCommands/resolveTemplatedOrGeneratedContentWithTitle.md)
- [runProjectInit](../../../../functions/src/commands/fileCreationCommands/runProjectInit.md)
- [generateBookmapContent](../../../../functions/src/commands/fileCreationCommands/generateBookmapContent.md)