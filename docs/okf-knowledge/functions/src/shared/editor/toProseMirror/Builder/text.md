---
type: TypeScript Method
title: text
resource: src/shared/editor/toProseMirror.ts#L476-L504
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toProseMirror/decodeText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private text(raw: string, start: number, state: InlineState, out: PMNode[]): void`

# Calls

- [decodeText](../../../../../../functions/src/shared/editor/toProseMirror/decodeText.md)
- [startsWith](../../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)