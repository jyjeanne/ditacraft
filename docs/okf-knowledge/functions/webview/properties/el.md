---
type: TypeScript Function
title: el
resource: webview/properties/main.ts#L39-L52
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/properties/control
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/properties/row
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/properties/render
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function el<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]> & Record<string, unknown> = {}, ...children: (Node | string)[]): HTMLElementTagNameMap[K]`

# Calls

- [entries](../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)
- [startsWith](../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [control](../../../functions/webview/properties/control.md)
- [row](../../../functions/webview/properties/row.md)
- [render](../../../functions/webview/properties/render.md)