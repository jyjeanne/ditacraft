---
type: TypeScript Function
title: baseAttrs
resource: src/shared/editor/schema.ts#L465-L479
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/schema/xmlAttr
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/schema/elementDom
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function baseAttrs(fact: ElementFacts, node: PMNode, cls: string): Record<string, string>`

# Calls

- [xmlAttr](../../../../../functions/src/shared/editor/schema/xmlAttr.md)

# Called by

- [elementDom](../../../../../functions/src/shared/editor/schema/elementDom.md)