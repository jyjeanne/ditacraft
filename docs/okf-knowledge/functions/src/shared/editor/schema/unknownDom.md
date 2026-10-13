---
type: TypeScript Function
title: unknownDom
resource: src/shared/editor/schema.ts#L608-L613
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/schema/viewText
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/schema/buildEditorSchema
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function unknownDom(node: PMNode, context: 'block' | 'inline'): DOMOutputSpec`

# Calls

- [viewText](../../../../../functions/src/shared/editor/schema/viewText.md)

# Called by

- [buildEditorSchema](../../../../../functions/src/shared/editor/schema/buildEditorSchema.md)