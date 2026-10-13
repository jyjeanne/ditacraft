---
type: TypeScript Method
title: setTarget
resource: src/shared/editor/mapCommands.ts#L184-L201
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/maps/selectedRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/canTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/openTag/withAttribute
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/links/linkAttributes
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/pickRowTarget
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`setTarget(target: LinkTarget): Command`

# Calls

- [selectedRow](../../../../../../functions/src/shared/editor/maps/selectedRow.md)
- [canTarget](../../../../../../functions/src/shared/editor/mapCommands/MapCommands/canTarget.md)
- [withAttribute](../../../../../../functions/src/shared/cst/openTag/withAttribute.md)
- [linkAttributes](../../../../../../functions/src/shared/editor/links/linkAttributes.md)

# Called by

- [pickRowTarget](../../../../../../functions/webview/editor/pickRowTarget.md)