---
type: TypeScript Method
title: blockMiddle
resource: src/shared/editor/toSource.ts#L606-L704
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toSource/Writer/separator
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/raw
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/outerEnd
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/outerStart
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/origin
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/placed
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/toSource/Writer/children
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private blockMiddle(old: PMNode[], neu: PMNode[], i: number, jo: number, jn: number, cStart: number, cEnd: number, indent: string): string`

# Calls

- [separator](../../../../../../functions/src/shared/editor/toSource/Writer/separator.md)
- [find](../../../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [has](../../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [raw](../../../../../../functions/src/shared/editor/toSource/Writer/raw.md)
- [outerEnd](../../../../../../functions/src/shared/editor/toSource/Writer/outerEnd.md)
- [outerStart](../../../../../../functions/src/shared/editor/toSource/Writer/outerStart.md)
- [origin](../../../../../../functions/src/shared/editor/toSource/Writer/origin.md)
- [placed](../../../../../../functions/src/shared/editor/toSource/Writer/placed.md)

# Called by

- [children](../../../../../../functions/src/shared/editor/toSource/Writer/children.md)