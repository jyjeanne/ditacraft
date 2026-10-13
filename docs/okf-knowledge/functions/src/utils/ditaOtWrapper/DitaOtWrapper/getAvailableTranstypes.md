---
type: TypeScript Method
title: getAvailableTranstypes
resource: src/utils/ditaOtWrapper.ts#L340-L366
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/ditaOtWrapper/parseTranstypes
    resolved_by: tree-sitter
    confidence: exact
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

# Calls

- [parseTranstypes](../../../../../functions/src/utils/ditaOtWrapper/parseTranstypes.md)

# Called by

- [publishCommand](../../../../../functions/src/commands/publishCommand/publishCommand.md)
- [pickTranstype](../../../../../functions/src/commands/publishProfilesCommand/pickTranstype.md)
- [executeValidation](../../../../../functions/src/commands/validateGuideCommand/executeValidation.md)