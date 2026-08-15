---
type: TypeScript Function
title: executePublish
resource: src/commands/publishCommand.ts#L203-L323
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/getOutputDirectory
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/debug
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/warn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtErrorParser/getDitaOtDiagnostics
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
  - target: functions/src/utils/ditaOtErrorParser/DitaOtDiagnostics/updateFromParsedOutput
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/info
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/errorUtils/fireAndForget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/openLogFile
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/publishCommand/publishCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishCommand/publishHTML5Command
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function executePublish( inputFile: string, transtype: string, ditaOt: DitaOtWrapper, overrides?: PublishOverrides ): Promise<void>`

# Calls

- [getOutputDirectory](../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/getOutputDirectory.md)
- [debug](../../../../functions/src/utils/logger/Logger/debug.md)
- [warn](../../../../functions/src/utils/logger/Logger/warn.md)
- [getDitaOtDiagnostics](../../../../functions/src/utils/ditaOtErrorParser/getDitaOtDiagnostics.md)
- [publish](../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/publish.md)
- [toVsCodeProgressReporter](../../../../functions/src/utils/ditaOtWrapper/toVsCodeProgressReporter.md)
- [parseDitaOtOutput](../../../../functions/src/utils/ditaOtErrorParser/parseDitaOtOutput.md)
- [updateFromParsedOutput](../../../../functions/src/utils/ditaOtErrorParser/DitaOtDiagnostics/updateFromParsedOutput.md)
- [info](../../../../functions/src/utils/logger/Logger/info.md)
- [fireAndForget](../../../../functions/src/utils/errorUtils/fireAndForget.md)
- [openLogFile](../../../../functions/src/utils/logger/Logger/openLogFile.md)

# Called by

- [publishCommand](../../../../functions/src/commands/publishCommand/publishCommand.md)
- [publishHTML5Command](../../../../functions/src/commands/publishCommand/publishHTML5Command.md)