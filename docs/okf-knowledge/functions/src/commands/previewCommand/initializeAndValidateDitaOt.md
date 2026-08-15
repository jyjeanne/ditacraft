---
type: TypeScript Function
title: initializeAndValidateDitaOt
resource: src/commands/previewCommand.ts#L263-L282
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/verifyInstallation
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/configureOtPath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/previewCommand/previewHTML5Command
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function initializeAndValidateDitaOt(): Promise<DitaOtWrapper>`

# Calls

- [verifyInstallation](../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/verifyInstallation.md)
- [configureOtPath](../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/configureOtPath.md)

# Called by

- [previewHTML5Command](../../../../functions/src/commands/previewCommand/previewHTML5Command.md)