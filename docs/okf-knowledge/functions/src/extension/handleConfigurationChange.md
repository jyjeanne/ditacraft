---
type: TypeScript Function
title: handleConfigurationChange
resource: src/extension.ts#L1167-L1225
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
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

- [verifyDitaOtInstallation](../../../functions/src/extension/verifyDitaOtInstallation.md)
- [getGlobalKeySpaceResolver](../../../functions/src/providers/ditaLinkProvider/getGlobalKeySpaceResolver.md)