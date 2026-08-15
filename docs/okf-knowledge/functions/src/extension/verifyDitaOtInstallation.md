---
type: TypeScript Function
title: verifyDitaOtInstallation
resource: src/extension.ts#L1112-L1149
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/debug
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/verifyInstallation
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/info
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

- [debug](../../../functions/src/utils/logger/Logger/debug.md)
- [verifyInstallation](../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/verifyInstallation.md)
- [info](../../../functions/src/utils/logger/Logger/info.md)
- [warn](../../../functions/src/utils/logger/Logger/warn.md)
- [fireAndForget](../../../functions/src/utils/errorUtils/fireAndForget.md)

# Called by

- [activate](../../../functions/src/extension/activate.md)
- [handleConfigurationChange](../../../functions/src/extension/handleConfigurationChange.md)