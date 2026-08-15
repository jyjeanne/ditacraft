---
type: TypeScript Function
title: parseFindOptions
resource: src/commands/findReplaceCommand.ts#L147-L156
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/commands/findReplaceCommand/findReplaceInFilesCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function parseFindOptions( selected: readonly { value: 'caseSensitive' | 'useRegex' | 'wholeWord' }[] ): { caseSensitive: boolean; useRegex: boolean; wholeWord: boolean }`

# Called by

- [findReplaceInFilesCommand](../../../../functions/src/commands/findReplaceCommand/findReplaceInFilesCommand.md)