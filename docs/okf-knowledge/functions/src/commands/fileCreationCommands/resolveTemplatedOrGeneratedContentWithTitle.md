---
type: TypeScript Function
title: resolveTemplatedOrGeneratedContentWithTitle
resource: src/commands/fileCreationCommands.ts#L196-L213
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/templateEngine/renderTemplate
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/todayIso
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/fileCreationCommands/newBookmapCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function resolveTemplatedOrGeneratedContentWithTitle( templateContext: TemplateContext, baseName: string, extension: string, id: string, title: string, fallback: () => string ): Promise<string>`

# Calls

- [renderTemplate](../../../../functions/src/utils/templateEngine/renderTemplate.md)
- [todayIso](../../../../functions/src/commands/fileCreationCommands/todayIso.md)

# Called by

- [newBookmapCommand](../../../../functions/src/commands/fileCreationCommands/newBookmapCommand.md)