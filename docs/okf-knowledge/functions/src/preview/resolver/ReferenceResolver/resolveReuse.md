---
type: TypeScript Method
title: resolveReuse
resource: src/preview/resolver.ts#L277-L373
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
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/findTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/isAncestor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/siblingRange
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveIn
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/preview/resolver/ReferenceResolver/resolveReuseOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/resolveOne
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async resolveReuse(el: ElementNode, doc: Document, docPath: string, pass: Pass, depth: number, chain: Set<string>): Promise<Resolution | undefined>`

# Calls

- [splitOnce](../../../../../functions/src/preview/resolver/splitOnce.md)
- [decode](../../../../../functions/src/preview/resolver/decode.md)
- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)
- [findTarget](../../../../../functions/src/preview/resolver/findTarget.md)
- [isAncestor](../../../../../functions/src/preview/resolver/isAncestor.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [siblingRange](../../../../../functions/src/preview/resolver/siblingRange.md)
- [resolveIn](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveIn.md)

# Called by

- [resolveReuseOf](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveReuseOf.md)
- [resolveOne](../../../../../functions/src/preview/resolver/ReferenceResolver/resolveOne.md)