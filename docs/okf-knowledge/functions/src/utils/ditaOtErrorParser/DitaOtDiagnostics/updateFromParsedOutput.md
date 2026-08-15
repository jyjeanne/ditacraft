---
type: TypeScript Method
title: updateFromParsedOutput
resource: src/utils/ditaOtErrorParser.ts#L331-L407
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/ditaOtErrorParser/DitaOtDiagnostics/createDiagnosticKey
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/debug
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/publishCommand/executePublish
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/validateGuideCommand/executeValidation
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/watchModeCommand/runWatchPublish
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public updateFromParsedOutput( parsedOutput: ParsedDitaOtOutput, fallbackUri?: vscode.Uri ): void`

# Calls

- [createDiagnosticKey](../../../../../functions/src/utils/ditaOtErrorParser/DitaOtDiagnostics/createDiagnosticKey.md)
- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [debug](../../../../../functions/src/utils/logger/Logger/debug.md)

# Called by

- [executePublish](../../../../../functions/src/commands/publishCommand/executePublish.md)
- [executeValidation](../../../../../functions/src/commands/validateGuideCommand/executeValidation.md)
- [runWatchPublish](../../../../../functions/src/commands/watchModeCommand/runWatchPublish.md)