---
type: TypeScript Method
title: trimEdges
resource: src/shared/editor/toProseMirror.ts#L394-L427
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/toProseMirror/Builder/inlineContent
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private trimEdges(out: PMNode[]): void`

# Calls

- [startsWith](../../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [inlineContent](../../../../../../functions/src/shared/editor/toProseMirror/Builder/inlineContent.md)