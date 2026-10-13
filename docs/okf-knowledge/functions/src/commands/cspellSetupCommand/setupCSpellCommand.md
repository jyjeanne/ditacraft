---
type: TypeScript Function
title: setupCSpellCommand
resource: src/commands/cspellSetupCommand.ts#L15-L90
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/readFile
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/registerCommands
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function setupCSpellCommand(extensionPath: string): Promise<void>`

# Calls

- [readFile](../../../../functions/webview/editor/readFile.md)

# Called by

- [registerCommands](../../../../functions/src/extension/registerCommands.md)