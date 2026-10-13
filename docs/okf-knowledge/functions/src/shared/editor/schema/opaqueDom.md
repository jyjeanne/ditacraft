---
type: TypeScript Function
title: opaqueDom
resource: src/shared/editor/schema.ts#L570-L606
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/maps/isMapRowElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/schema/xmlAttr
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/mapRowDom
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/html/cssLength
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/schema/viewText
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/schema/buildEditorSchema
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function opaqueDom(fact: ElementFacts, node: PMNode, context: 'block' | 'inline', es: EditorSchema, labels: Labels): DOMOutputSpec`

# Calls

- [isMapRowElement](../../../../../functions/src/shared/editor/maps/isMapRowElement.md)
- [xmlAttr](../../../../../functions/src/shared/editor/schema/xmlAttr.md)
- [mapRowDom](../../../../../functions/src/shared/editor/maps/mapRowDom.md)
- [cssLength](../../../../../functions/src/shared/render/html/cssLength.md)
- [viewText](../../../../../functions/src/shared/editor/schema/viewText.md)

# Called by

- [buildEditorSchema](../../../../../functions/src/shared/editor/schema/buildEditorSchema.md)