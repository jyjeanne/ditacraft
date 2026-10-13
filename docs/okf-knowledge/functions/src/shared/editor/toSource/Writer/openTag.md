---
type: TypeScript Method
title: openTag
resource: src/shared/editor/toSource.ts#L187-L197
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/raw
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private openTag(name: string, xml: Pairs, el: ElementNode | undefined, oldXml: Pairs | undefined, selfClosing: boolean): string`

# Calls

- [find](../../../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [raw](../../../../../../functions/src/shared/editor/toSource/Writer/raw.md)