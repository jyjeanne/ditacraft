---
type: TypeScript Function
title: resolvedNodeViews
resource: webview/editor/reusedView.ts#L118-L129
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/reused/isReuseNode
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/start
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function resolvedNodeViews(es: EditorSchema): Record<string, NodeViewConstructor>`

# Calls

- [isReuseNode](../../../../functions/src/shared/editor/reused/isReuseNode.md)

# Called by

- [start](../../../../functions/webview/editor/start.md)