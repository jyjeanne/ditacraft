---
type: TypeScript Function
title: resolvedPlugin
resource: webview/editor/main.ts#L204-L213
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/followMoves
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/plugins
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function resolvedPlugin(): Plugin<DecorationSet>`

# Calls

- [followMoves](../../../functions/webview/editor/followMoves.md)

# Called by

- [plugins](../../../functions/webview/editor/plugins.md)