---
type: TypeScript Function
title: decodeText
resource: src/shared/editor/toProseMirror.ts#L102-L170
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/toProseMirror/Builder/text
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function decodeText(raw: string, start: number, preserve: boolean): Piece[]`

# Calls

- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [text](../../../../../functions/src/shared/editor/toProseMirror/Builder/text.md)