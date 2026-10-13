---
type: TypeScript Method
title: insertAfter
resource: src/shared/editor/commands.ts#L160-L175
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/commands/DitaCommands/textType
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/ImageCommands/insert
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private insertAfter(tr: Transaction, $pos: ResolvedPos): boolean`

# Calls

- [textType](../../../../../../functions/src/shared/editor/commands/DitaCommands/textType.md)
- [insert](../../../../../../functions/src/shared/editor/images/ImageCommands/insert.md)