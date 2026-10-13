---
type: TypeScript Method
title: typeAhead
resource: webview/editor/menu.ts#L304-L318
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/menu/ContextMenu/onKey
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private typeAhead(items: HTMLButtonElement[], index: number, key: string): boolean`

# Calls

- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [onKey](../../../../../functions/webview/editor/menu/ContextMenu/onKey.md)