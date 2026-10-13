---
type: TypeScript Function
title: elementDom
resource: src/shared/editor/schema.ts#L481-L556
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/maps/isMapRowElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/mapRowDom
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/schema/presentationOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/schema/baseAttrs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/schema/xmlAttr
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/columnWidths/cssColumnWidths
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/schema/buildEditorSchema
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function elementDom(fact: ElementFacts, node: PMNode, context: 'block' | 'inline', variant: Variant, es: EditorSchema, labels: Labels): DOMOutputSpec`

# Calls

- [isMapRowElement](../../../../../functions/src/shared/editor/maps/isMapRowElement.md)
- [mapRowDom](../../../../../functions/src/shared/editor/maps/mapRowDom.md)
- [presentationOf](../../../../../functions/src/shared/editor/schema/presentationOf.md)
- [baseAttrs](../../../../../functions/src/shared/editor/schema/baseAttrs.md)
- [xmlAttr](../../../../../functions/src/shared/editor/schema/xmlAttr.md)
- [cssColumnWidths](../../../../../functions/src/shared/editor/columnWidths/cssColumnWidths.md)

# Called by

- [buildEditorSchema](../../../../../functions/src/shared/editor/schema/buildEditorSchema.md)