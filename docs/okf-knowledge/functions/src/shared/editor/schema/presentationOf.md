---
type: TypeScript Function
title: presentationOf
resource: src/shared/editor/schema.ts#L449-L457
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/schema/elementDom
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/schema/markDom
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function presentationOf(fact: ElementFacts): Presentation | undefined`

# Called by

- [elementDom](../../../../../functions/src/shared/editor/schema/elementDom.md)
- [markDom](../../../../../functions/src/shared/editor/schema/markDom.md)