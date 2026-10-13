---
type: TypeScript Function
title: isDitaContentUri
resource: src/utils/constants.ts#L133-L135
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/constants/isDitaContentPath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/findReplaceCommand/findReplaceInFilesCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/inlineConrefCommand/inlineConrefCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/insertImageCommand/isEligibleDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalDecorationProvider/recompute
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isDitaContentUri(uri: import('vscode').Uri): boolean`

# Calls

- [isDitaContentPath](../../../../functions/src/utils/constants/isDitaContentPath.md)

# Called by

- [findReplaceInFilesCommand](../../../../functions/src/commands/findReplaceCommand/findReplaceInFilesCommand.md)
- [inlineConrefCommand](../../../../functions/src/commands/inlineConrefCommand/inlineConrefCommand.md)
- [isEligibleDocument](../../../../functions/src/commands/insertImageCommand/isEligibleDocument.md)
- [recompute](../../../../functions/src/providers/ditavalDecorationProvider/recompute.md)