---
type: TypeScript Function
title: validateGuidePrerequisites
resource: src/commands/validateGuideCommand.ts#L52-L110
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/verifyInstallation
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/validateGuideCommand/executeValidation
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function validateGuidePrerequisites(): Promise<GuideValidationContext | null>`

# Calls

- [verifyInstallation](../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/verifyInstallation.md)
- [getConfiguration](../../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)
- [get](../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)

# Called by

- [executeValidation](../../../../functions/src/commands/validateGuideCommand/executeValidation.md)