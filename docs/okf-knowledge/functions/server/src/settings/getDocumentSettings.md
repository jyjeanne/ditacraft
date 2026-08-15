---
type: TypeScript Function
title: getDocumentSettings
resource: server/src/settings.ts#L86-L109
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/getConfiguration
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/fragmentValidator/handleValidateFragment
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function getDocumentSettings(resource: string): Thenable<DitaCraftSettings>`

# Calls

- [get](../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [getConfiguration](../../../../functions/src/utils/configurationManager/ConfigurationManager/getConfiguration.md)

# Called by

- [handleValidateFragment](../../../../functions/server/src/features/fragmentValidator/handleValidateFragment.md)