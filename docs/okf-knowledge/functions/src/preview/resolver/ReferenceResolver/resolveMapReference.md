---
type: TypeScript Method
title: resolveMapReference
resource: src/preview/resolver.ts#L151-L190
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/resolver/splitOnce
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/decode
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/titleOfFile
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/reusedContent/mapRowItems
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async resolveMapReference(el: ElementNode, docPath: string, deps: Set<string>): Promise<Resolution | undefined>`

# Calls

- [splitOnce](../../../../../functions/src/preview/resolver/splitOnce.md)
- [decode](../../../../../functions/src/preview/resolver/decode.md)
- [titleOfFile](../../../../../functions/src/preview/resolver/ReferenceResolver/titleOfFile.md)

# Called by

- [mapRowItems](../../../../../functions/src/editor/reusedContent/mapRowItems.md)