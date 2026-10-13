---
type: TypeScript Function
title: detachNode
resource: src/shared/editor/toProseMirror.ts#L609-L623
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/sourceChange/sourceChange
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/buildFragment
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function detachNode(node: PMNode, origin: WeakMap<PMNode, NodeOrigin>, source: string): PMNode`

# Called by

- [sourceChange](../../../../../functions/src/shared/editor/sourceChange/sourceChange.md)
- [buildFragment](../../../../../functions/src/shared/editor/toProseMirror/buildFragment.md)