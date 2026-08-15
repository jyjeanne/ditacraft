---
type: TypeScript Function
title: loadTemplateRaw
resource: src/utils/templateEngine.ts#L91-L108
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
  - target: functions/src/utils/templateEngine/renderTemplate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function loadTemplateRaw( templatesDir: string, baseName: string, extension: string ): Promise<string | undefined>`

# Called by

- [resolveTemplatedOrGeneratedContent](../../../../functions/src/commands/fileCreationCommands/resolveTemplatedOrGeneratedContent.md)
- [runProjectInit](../../../../functions/src/commands/fileCreationCommands/runProjectInit.md)
- [renderTemplate](../../../../functions/src/utils/templateEngine/renderTemplate.md)