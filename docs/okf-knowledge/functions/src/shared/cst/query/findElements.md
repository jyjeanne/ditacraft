---
type: TypeScript Function
title: findElements
resource: src/shared/cst/query.ts#L54-L62
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/types/isElement
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/test/shared/editorTables/test/check
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findElements(doc: Document, name: string): ElementNode[]`

# Calls

- [isElement](../../../../../functions/src/shared/cst/types/isElement.md)

# Called by

- [check](../../../../../functions/src/test/shared/editorTables/test/check.md)