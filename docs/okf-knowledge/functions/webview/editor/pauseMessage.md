---
type: TypeScript Function
title: pauseMessage
resource: webview/editor/main.ts#L556-L562
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/labels/format
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/start
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/rebuild
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function pauseMessage(error: unknown, text: string, labels: Labels): string`

# Calls

- [format](../../../functions/src/shared/render/labels/format.md)

# Called by

- [start](../../../functions/webview/editor/start.md)
- [rebuild](../../../functions/webview/editor/rebuild.md)