---
type: TypeScript Method
title: declares
resource: src/shared/editor/mapCommands.ts#L50-L52
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/grammar/types/elementAttributes
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/mapCommands/MapCommands/canTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/referenceElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/setLabel
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private declares(element: string, attribute: string): boolean`

# Calls

- [elementAttributes](../../../../../../functions/src/shared/grammar/types/elementAttributes.md)

# Called by

- [canTarget](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/canTarget.md)
- [referenceElement](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/referenceElement.md)
- [setLabel](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/setLabel.md)