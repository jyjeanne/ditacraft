---
type: TypeScript Function
title: markDom
resource: src/shared/editor/schema.ts#L558-L562
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/schema/presentationOf
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/schema/buildEditorSchema
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function markDom(fact: ElementFacts): DOMOutputSpec`

# Calls

- [presentationOf](../../../../../functions/src/shared/editor/schema/presentationOf.md)

# Called by

- [buildEditorSchema](../../../../../functions/src/shared/editor/schema/buildEditorSchema.md)