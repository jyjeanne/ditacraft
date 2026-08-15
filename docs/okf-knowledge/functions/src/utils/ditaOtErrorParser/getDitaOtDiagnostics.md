---
type: TypeScript Function
title: getDitaOtDiagnostics
resource: src/utils/ditaOtErrorParser.ts#L432-L437
generated:
  by: okf-rs/0.4.0
relationships:
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

`function getDitaOtDiagnostics(): DitaOtDiagnostics`

# Called by

- [executePublish](../../../../functions/src/commands/publishCommand/executePublish.md)
- [executeValidation](../../../../functions/src/commands/validateGuideCommand/executeValidation.md)
- [runWatchPublish](../../../../functions/src/commands/watchModeCommand/runWatchPublish.md)