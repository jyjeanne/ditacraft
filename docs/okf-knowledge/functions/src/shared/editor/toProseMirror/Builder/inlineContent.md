---
type: TypeScript Method
title: inlineContent
resource: src/shared/editor/toProseMirror.ts#L381-L391
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toProseMirror/Builder/trimEdges
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/shared/editor/toProseMirror/Builder/block
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/blockContent
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private inlineContent(children: CstNode[], preserve: boolean): Fragment`

# Calls

- [trimEdges](../../../../../../functions/src/shared/editor/toProseMirror/Builder/trimEdges.md)

# Called by

- [block](../../../../../../functions/src/shared/editor/toProseMirror/Builder/block.md)
- [blockContent](../../../../../../functions/src/shared/editor/toProseMirror/Builder/blockContent.md)