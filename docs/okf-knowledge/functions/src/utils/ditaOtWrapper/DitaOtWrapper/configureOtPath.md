---
type: TypeScript Method
title: configureOtPath
resource: src/utils/ditaOtWrapper.ts#L749-L797
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/verifyInstallation
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/configureCommand/configureDitaOTCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/previewCommand/initializeAndValidateDitaOt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishCommand/validateAndPrepareForPublish
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public async configureOtPath(): Promise<void>`

# Calls

- [getConfiguration](../../../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)
- [verifyInstallation](../../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/verifyInstallation.md)

# Called by

- [configureDitaOTCommand](../../../../../functions/src/commands/configureCommand/configureDitaOTCommand.md)
- [initializeAndValidateDitaOt](../../../../../functions/src/commands/previewCommand/initializeAndValidateDitaOt.md)
- [validateAndPrepareForPublish](../../../../../functions/src/commands/publishCommand/validateAndPrepareForPublish.md)