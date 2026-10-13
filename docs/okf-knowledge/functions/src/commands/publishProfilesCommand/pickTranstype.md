---
type: TypeScript Function
title: pickTranstype
resource: src/commands/publishProfilesCommand.ts#L339-L356
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/verifyInstallation
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/getAvailableTranstypes
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/publishProfilesCommand/promptForProfile
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function pickTranstype(currentValue?: string): Promise<string | undefined>`

# Calls

- [verifyInstallation](../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/verifyInstallation.md)
- [getAvailableTranstypes](../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/getAvailableTranstypes.md)

# Called by

- [promptForProfile](../../../../functions/src/commands/publishProfilesCommand/promptForProfile.md)