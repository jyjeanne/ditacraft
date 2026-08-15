---
type: TypeScript Method
title: getAvailableTranstypes
resource: src/utils/ditaOtWrapper.ts#L323-L359
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/commands/publishCommand/publishCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/pickTranstype
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/validateGuideCommand/executeValidation
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public async getAvailableTranstypes(): Promise<string[]>`

# Called by

- [publishCommand](../../../../../functions/src/commands/publishCommand/publishCommand.md)
- [pickTranstype](../../../../../functions/src/commands/publishProfilesCommand/pickTranstype.md)
- [executeValidation](../../../../../functions/src/commands/validateGuideCommand/executeValidation.md)