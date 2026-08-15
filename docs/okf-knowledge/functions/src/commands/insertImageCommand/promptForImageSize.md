---
type: TypeScript Function
title: promptForImageSize
resource: src/commands/insertImageCommand.ts#L254-L290
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/commands/insertImageCommand/promptForNmtokenValue
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/insertImageCommand/insertImageCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function promptForImageSize(): Promise<ImageSizeAttrs | undefined | null>`

# Calls

- [promptForNmtokenValue](../../../../functions/src/commands/insertImageCommand/promptForNmtokenValue.md)

# Called by

- [insertImageCommand](../../../../functions/src/commands/insertImageCommand/insertImageCommand.md)