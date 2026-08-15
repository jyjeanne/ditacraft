---
type: TypeScript Function
title: parseDitaOtOutput
resource: src/utils/ditaOtErrorParser.ts#L145-L208
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/ditaOtErrorParser/isErrorLine
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtErrorParser/parseErrorLine
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

`function parseDitaOtOutput(output: string, baseDir?: string): ParsedDitaOtOutput`

# Calls

- [isErrorLine](../../../../functions/src/utils/ditaOtErrorParser/isErrorLine.md)
- [parseErrorLine](../../../../functions/src/utils/ditaOtErrorParser/parseErrorLine.md)
- [debug](../../../../functions/src/utils/logger/Logger/debug.md)

# Called by

- [executePublish](../../../../functions/src/commands/publishCommand/executePublish.md)
- [executeValidation](../../../../functions/src/commands/validateGuideCommand/executeValidation.md)
- [runWatchPublish](../../../../functions/src/commands/watchModeCommand/runWatchPublish.md)