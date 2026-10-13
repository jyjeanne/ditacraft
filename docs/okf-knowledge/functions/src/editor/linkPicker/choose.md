---
type: TypeScript Function
title: choose
resource: src/editor/linkPicker.ts#L162-L193
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkPicker/toQuickPick
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function choose(ctx: LinkPickerContext, title: string, placeholder: string, items: PickItem[], more?: Promise<PickItem[]>, typed?: (value: string) => PickItem | undefined): Promise<PickItem | undefined>`

# Calls

- [find](../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [toQuickPick](../../../../functions/src/editor/linkPicker/toQuickPick.md)