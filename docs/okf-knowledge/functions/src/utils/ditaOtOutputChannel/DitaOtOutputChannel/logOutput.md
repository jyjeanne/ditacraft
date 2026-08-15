---
type: TypeScript Method
title: logOutput
resource: src/utils/ditaOtOutputChannel.ts#L168-L173
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/ditaOtOutputChannel/DitaOtOutputChannel/logLine
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/publish
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public logOutput(output: string): void`

# Calls

- [logLine](../../../../../functions/src/utils/ditaOtOutputChannel/DitaOtOutputChannel/logLine.md)

# Called by

- [publish](../../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/publish.md)