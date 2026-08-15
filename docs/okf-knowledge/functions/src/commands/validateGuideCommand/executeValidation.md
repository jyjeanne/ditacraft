---
type: TypeScript Function
title: executeValidation
resource: src/commands/validateGuideCommand.ts#L115-L218
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/commands/validateGuideCommand/validateGuidePrerequisites
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/getAvailableTranstypes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/publish
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/toVsCodeProgressReporter
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtErrorParser/parseDitaOtOutput
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/validateGuideCommand/mapToValidationIssues
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtErrorParser/getDitaOtDiagnostics
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtErrorParser/DitaOtDiagnostics/updateFromParsedOutput
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/info
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/warn
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/validateGuideCommand/validateGuideCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function executeValidation(context: vscode.ExtensionContext): Promise<void>`

# Calls

- [validateGuidePrerequisites](../../../../functions/src/commands/validateGuideCommand/validateGuidePrerequisites.md)
- [getAvailableTranstypes](../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/getAvailableTranstypes.md)
- [publish](../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/publish.md)
- [toVsCodeProgressReporter](../../../../functions/src/utils/ditaOtWrapper/toVsCodeProgressReporter.md)
- [parseDitaOtOutput](../../../../functions/src/utils/ditaOtErrorParser/parseDitaOtOutput.md)
- [mapToValidationIssues](../../../../functions/src/commands/validateGuideCommand/mapToValidationIssues.md)
- [getDitaOtDiagnostics](../../../../functions/src/utils/ditaOtErrorParser/getDitaOtDiagnostics.md)
- [updateFromParsedOutput](../../../../functions/src/utils/ditaOtErrorParser/DitaOtDiagnostics/updateFromParsedOutput.md)
- [info](../../../../functions/src/utils/logger/Logger/info.md)
- [warn](../../../../functions/src/utils/logger/Logger/warn.md)

# Called by

- [validateGuideCommand](../../../../functions/src/commands/validateGuideCommand/validateGuideCommand.md)