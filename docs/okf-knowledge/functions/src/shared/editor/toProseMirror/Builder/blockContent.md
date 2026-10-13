---
type: TypeScript Method
title: blockContent
resource: src/shared/editor/toProseMirror.ts#L333-L373
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toProseMirror/Builder/inlineContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/types/isElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/block
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/toProseMirror/Builder/block
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private blockContent(children: CstNode[], mixed: boolean, preserve: boolean): Fragment`

# Calls

- [inlineContent](../../../../../../functions/src/shared/editor/toProseMirror/Builder/inlineContent.md)
- [isElement](../../../../../../functions/src/shared/cst/types/isElement.md)
- [block](../../../../../../functions/src/shared/editor/toProseMirror/Builder/block.md)

# Called by

- [block](../../../../../../functions/src/shared/editor/toProseMirror/Builder/block.md)