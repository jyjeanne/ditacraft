---
type: TypeScript Function
title: insertTableCommand
resource: src/commands/insertTableCommand.ts#L36-L105
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/debug
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/insertTableCommand/promptForCount
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/insertTableCommand/buildCalsTableSnippet
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/insertTableCommand/buildSimpleTableSnippet
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/editorInsertUtils/insertAtCursor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/info
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/registerCommands
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function insertTableCommand(): Promise<void>`

# Calls

- [debug](../../../../functions/src/utils/logger/Logger/debug.md)
- [promptForCount](../../../../functions/src/commands/insertTableCommand/promptForCount.md)
- [buildCalsTableSnippet](../../../../functions/src/commands/insertTableCommand/buildCalsTableSnippet.md)
- [buildSimpleTableSnippet](../../../../functions/src/commands/insertTableCommand/buildSimpleTableSnippet.md)
- [insertAtCursor](../../../../functions/src/utils/editorInsertUtils/insertAtCursor.md)
- [info](../../../../functions/src/utils/logger/Logger/info.md)

# Called by

- [registerCommands](../../../../functions/src/extension/registerCommands.md)