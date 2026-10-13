---
type: TypeScript Function
title: droppedUris
resource: src/shared/editor/images.ts#L62-L82
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/dropImages
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function droppedUris(get: (type: string) => string): string[]`

# Calls

- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [dropImages](../../../../../functions/webview/editor/dropImages.md)