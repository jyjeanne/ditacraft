---
type: TypeScript Method
title: newNavtitle
resource: src/shared/editor/mapCommands.ts#L347-L363
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/mapCommands/MapCommands/accepts
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/mapCommands/MapCommands/setLabel
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private newNavtitle(row: PMNode, meta: PMNode | undefined, text: string): { node: PMNode; at: 'meta' | 'row' } | undefined`

# Calls

- [accepts](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/accepts.md)

# Called by

- [setLabel](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/setLabel.md)