---
type: TypeScript Function
title: substituteWorkspaceFolderVar
resource: src/utils/pathUtils.ts#L21-L24
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/commands/publishProfilesCommand/resolveProfileOutputDir
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/loadConfiguration
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/templateEngine/resolveTemplatesDir
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function substituteWorkspaceFolderVar(value: string): string`

# Called by

- [resolveProfileOutputDir](../../../../functions/src/commands/publishProfilesCommand/resolveProfileOutputDir.md)
- [loadConfiguration](../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/loadConfiguration.md)
- [resolveTemplatesDir](../../../../functions/src/utils/templateEngine/resolveTemplatesDir.md)