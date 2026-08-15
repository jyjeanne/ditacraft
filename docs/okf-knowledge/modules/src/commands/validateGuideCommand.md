---
type: TypeScript Module
title: validateGuideCommand
resource: src/commands/validateGuideCommand.ts#L1-L245
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/vscode
    resolved_by: tree-sitter
    confidence: exact
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/os
    resolved_by: tree-sitter
    confidence: exact
  - target: external/fs
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-ditaotwrapper
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-ditaoterrorparser
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-logger
    resolved_by: tree-sitter
    confidence: exact
  - target: external/providers-validationreportpanel
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-ditaoterrorcodes
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [GuideValidationContext](../../../interfaces/src/commands/validateGuideCommand/GuideValidationContext.md)
- [validateGuideCommand](../../../functions/src/commands/validateGuideCommand/validateGuideCommand.md)
- [validateGuidePrerequisites](../../../functions/src/commands/validateGuideCommand/validateGuidePrerequisites.md)
- [executeValidation](../../../functions/src/commands/validateGuideCommand/executeValidation.md)
- [mapToValidationIssues](../../../functions/src/commands/validateGuideCommand/mapToValidationIssues.md)

# Imports

- `vscode`
- `path`
- `os`
- `fs`
- `../utils/ditaOtWrapper`
- `../utils/ditaOtErrorParser`
- `../utils/logger`
- `../providers/validationReportPanel`
- `../utils/ditaOtErrorCodes`

# Member of

- [ditacraft](../../../packages/ditacraft.md)