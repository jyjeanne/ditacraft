---
type: TypeScript Function
title: inlineConrefCommand
resource: src/commands/inlineConrefCommand.ts#L42-L88
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/languageClient/getLanguageClient
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/constants/isDitaContentUri
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/info
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/warn
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/registerCommands
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function inlineConrefCommand(): Promise<void>`

# Calls

- [getLanguageClient](../../../../functions/src/languageClient/getLanguageClient.md)
- [isDitaContentUri](../../../../functions/src/utils/constants/isDitaContentUri.md)
- [info](../../../../functions/src/utils/logger/Logger/info.md)
- [warn](../../../../functions/src/utils/logger/Logger/warn.md)

# Called by

- [registerCommands](../../../../functions/src/extension/registerCommands.md)