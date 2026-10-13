---
type: TypeScript Function
title: reuseResult
resource: webview/editor/main.ts#L1769-L1782
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/noteReuse
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/labels/format
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/replaceWithCopy
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function reuseResult(message: Extract<HostToEditor, { type: 'reuseResult' }>): void`

# Calls

- [noteReuse](../../../functions/webview/editor/noteReuse.md)
- [format](../../../functions/src/shared/render/labels/format.md)
- [replaceWithCopy](../../../functions/webview/editor/replaceWithCopy.md)