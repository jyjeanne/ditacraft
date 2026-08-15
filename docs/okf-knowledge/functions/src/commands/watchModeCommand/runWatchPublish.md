---
type: TypeScript Function
title: runWatchPublish
resource: src/commands/watchModeCommand.ts#L223-L316
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/getOutputDirectory
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
  - target: functions/src/utils/ditaOtErrorParser/parseDitaOtOutput
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtErrorParser/DitaOtDiagnostics/updateFromParsedOutput
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/info
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/watchModeCommand/flashStatus
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/watchModeCommand/startWatchModeCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/watchModeCommand/scheduleRepublish
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function runWatchPublish(): Promise<void>`

# Calls

- [getOutputDirectory](../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/getOutputDirectory.md)
- [warn](../../../../functions/src/utils/logger/Logger/warn.md)
- [getDitaOtDiagnostics](../../../../functions/src/utils/ditaOtErrorParser/getDitaOtDiagnostics.md)
- [publish](../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/publish.md)
- [parseDitaOtOutput](../../../../functions/src/utils/ditaOtErrorParser/parseDitaOtOutput.md)
- [updateFromParsedOutput](../../../../functions/src/utils/ditaOtErrorParser/DitaOtDiagnostics/updateFromParsedOutput.md)
- [info](../../../../functions/src/utils/logger/Logger/info.md)
- [flashStatus](../../../../functions/src/commands/watchModeCommand/flashStatus.md)

# Called by

- [startWatchModeCommand](../../../../functions/src/commands/watchModeCommand/startWatchModeCommand.md)
- [scheduleRepublish](../../../../functions/src/commands/watchModeCommand/scheduleRepublish.md)