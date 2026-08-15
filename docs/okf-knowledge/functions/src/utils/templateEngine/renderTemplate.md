---
type: TypeScript Function
title: renderTemplate
resource: src/utils/templateEngine.ts#L118-L126
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/templateEngine/loadTemplateRaw
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/templateEngine/substitutePlaceholders
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/fileCreationCommands/resolveTemplatedOrGeneratedContentWithTitle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function renderTemplate( templatesDir: string, baseName: string, extension: string, variables: TemplateVariables ): Promise<string | undefined>`

# Calls

- [loadTemplateRaw](../../../../functions/src/utils/templateEngine/loadTemplateRaw.md)
- [substitutePlaceholders](../../../../functions/src/utils/templateEngine/substitutePlaceholders.md)

# Called by

- [resolveTemplatedOrGeneratedContentWithTitle](../../../../functions/src/commands/fileCreationCommands/resolveTemplatedOrGeneratedContentWithTitle.md)