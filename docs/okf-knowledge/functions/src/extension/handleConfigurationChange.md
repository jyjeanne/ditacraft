---
type: TypeScript Function
title: handleConfigurationChange
resource: src/extension.ts#L1049-L1107
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/info
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/debug
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/verifyDitaOtInstallation
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/getGlobalKeySpaceResolver
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function handleConfigurationChange(event: ConfigurationChangeEvent): void`

# Calls

- [info](../../../functions/src/utils/logger/Logger/info.md)
- [get](../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [debug](../../../functions/src/utils/logger/Logger/debug.md)
- [verifyDitaOtInstallation](../../../functions/src/extension/verifyDitaOtInstallation.md)
- [getGlobalKeySpaceResolver](../../../functions/src/providers/ditaLinkProvider/getGlobalKeySpaceResolver.md)