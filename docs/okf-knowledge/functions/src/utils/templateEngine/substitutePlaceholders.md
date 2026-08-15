---
type: TypeScript Function
title: substitutePlaceholders
resource: src/utils/templateEngine.ts#L71-L77
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

`function substitutePlaceholders(content: string, variables: TemplateVariables): string`

# Called by

- [resolveTemplatedOrGeneratedContent](../../../../functions/src/commands/fileCreationCommands/resolveTemplatedOrGeneratedContent.md)
- [runProjectInit](../../../../functions/src/commands/fileCreationCommands/runProjectInit.md)
- [renderTemplate](../../../../functions/src/utils/templateEngine/renderTemplate.md)