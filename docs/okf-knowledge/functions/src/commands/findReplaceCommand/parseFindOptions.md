---
type: TypeScript Function
title: parseFindOptions
resource: src/commands/findReplaceCommand.ts#L206-L216
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/findReplaceCommand/findReplaceInFilesCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function parseFindOptions( selected: readonly { value: FindOption }[] ): { caseSensitive: boolean; useRegex: boolean; wholeWord: boolean; includeAttributeValues: boolean }`

# Calls

- [has](../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [findReplaceInFilesCommand](../../../../functions/src/commands/findReplaceCommand/findReplaceInFilesCommand.md)