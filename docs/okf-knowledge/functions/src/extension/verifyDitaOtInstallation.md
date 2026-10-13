---
type: TypeScript Function
title: verifyDitaOtInstallation
resource: src/extension.ts#L1230-L1267
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/verifyInstallation
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/warn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/errorUtils/fireAndForget
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/handleConfigurationChange
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function verifyDitaOtInstallation(): Promise<void>`

# Calls

- [verifyInstallation](../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/verifyInstallation.md)
- [warn](../../../functions/src/utils/logger/Logger/warn.md)
- [fireAndForget](../../../functions/src/utils/errorUtils/fireAndForget.md)

# Called by

- [activate](../../../functions/src/extension/activate.md)
- [handleConfigurationChange](../../../functions/src/extension/handleConfigurationChange.md)