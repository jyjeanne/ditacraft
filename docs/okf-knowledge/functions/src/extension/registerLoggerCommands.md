---
type: TypeScript Function
title: registerLoggerCommands
resource: src/extension.ts#L1112-L1142
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/showLogFileLocation
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/openLogFile
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function registerLoggerCommands(context: vscode.ExtensionContext): void`

# Calls

- [showLogFileLocation](../../../functions/src/utils/logger/Logger/showLogFileLocation.md)
- [openLogFile](../../../functions/src/utils/logger/Logger/openLogFile.md)

# Called by

- [activate](../../../functions/src/extension/activate.md)