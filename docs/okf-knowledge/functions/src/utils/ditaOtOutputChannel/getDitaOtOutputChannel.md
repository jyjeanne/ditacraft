---
type: TypeScript Function
title: getDitaOtOutputChannel
resource: src/utils/ditaOtOutputChannel.ts#L235-L237
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/extension/registerCommands
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/validationReportPanel/ValidationReportPanel/_handleMessage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/publish
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function getDitaOtOutputChannel(): DitaOtOutputChannel`

# Called by

- [registerCommands](../../../../functions/src/extension/registerCommands.md)
- [_handleMessage](../../../../functions/src/providers/validationReportPanel/ValidationReportPanel/_handleMessage.md)
- [publish](../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/publish.md)