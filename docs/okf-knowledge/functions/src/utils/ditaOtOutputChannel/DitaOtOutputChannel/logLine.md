---
type: TypeScript Method
title: logLine
resource: src/utils/ditaOtOutputChannel.ts#L138-L163
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/ditaOtOutputChannel/DitaOtOutputChannel/detectLogLevel
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/warn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/info
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/debug
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
- [info](../../../../../functions/src/utils/logger/Logger/info.md)
- [debug](../../../../../functions/src/utils/logger/Logger/debug.md)

# Called by

- [logOutput](../../../../../functions/src/utils/ditaOtOutputChannel/DitaOtOutputChannel/logOutput.md)