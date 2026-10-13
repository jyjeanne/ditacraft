---
type: TypeScript Method
title: logLine
resource: src/utils/ditaOtOutputChannel.ts#L138-L163
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/ditaOtOutputChannel/DitaOtOutputChannel/detectLogLevel
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/warn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/scripts/cover/trace-logo/trace
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/utils/ditaOtOutputChannel/DitaOtOutputChannel/logOutput
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public logLine(line: string): void`

# Calls

- [detectLogLevel](../../../../../functions/src/utils/ditaOtOutputChannel/DitaOtOutputChannel/detectLogLevel.md)
- [warn](../../../../../functions/src/utils/logger/Logger/warn.md)
- [trace](../../../../../functions/scripts/cover/trace-logo/trace.md)

# Called by

- [logOutput](../../../../../functions/src/utils/ditaOtOutputChannel/DitaOtOutputChannel/logOutput.md)