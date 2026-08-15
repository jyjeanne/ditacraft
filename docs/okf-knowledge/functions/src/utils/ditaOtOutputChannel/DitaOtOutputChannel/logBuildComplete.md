---
type: TypeScript Method
title: logBuildComplete
resource: src/utils/ditaOtOutputChannel.ts#L196-L208
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/info
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtOutputChannel/DitaOtOutputChannel/formatTime
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/publish
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public logBuildComplete(success: boolean, outputPath: string, duration?: number): void`

# Calls

- [info](../../../../../functions/src/utils/logger/Logger/info.md)
- [formatTime](../../../../../functions/src/utils/ditaOtOutputChannel/DitaOtOutputChannel/formatTime.md)

# Called by

- [publish](../../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/publish.md)