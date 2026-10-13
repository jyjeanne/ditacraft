---
type: TypeScript Function
title: findItem
resource: src/shared/editor/contextMenu.ts#L292-L305
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/webview/editor/debug
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findItem(items: MenuItem[], id: string): Extract<MenuItem, { kind: 'item' }> | undefined`

# Called by

- [debug](../../../../../functions/webview/editor/debug.md)