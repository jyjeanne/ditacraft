---
type: TypeScript Function
title: resolveTemplatesDir
resource: src/utils/templateEngine.ts#L43-L57
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/pathUtils/substituteWorkspaceFolderVar
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/fileCreationCommands/getTemplateContext
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function resolveTemplatesDir(templatesPath: string | undefined): string | undefined`

# Calls

- [substituteWorkspaceFolderVar](../../../../functions/src/utils/pathUtils/substituteWorkspaceFolderVar.md)

# Called by

- [getTemplateContext](../../../../functions/src/commands/fileCreationCommands/getTemplateContext.md)