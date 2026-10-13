---
type: TypeScript Method
title: viewFor
resource: src/shared/editor/toProseMirror.ts#L580-L587
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/types/isElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/columnWidths/tgroupWidths
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/toProseMirror/Builder/block
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private viewFor(el: ElementNode, facts: ElementFacts): Record<string, unknown> | null`

# Calls

- [isElement](../../../../../../functions/src/shared/cst/types/isElement.md)
- [tgroupWidths](../../../../../../functions/src/shared/editor/columnWidths/tgroupWidths.md)

# Called by

- [block](../../../../../../functions/src/shared/editor/toProseMirror/Builder/block.md)