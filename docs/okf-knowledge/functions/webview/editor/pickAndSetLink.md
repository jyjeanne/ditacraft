---
type: TypeScript Function
title: pickAndSetLink
resource: webview/editor/main.ts#L1345-L1366
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/editable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/links/LinkCommands/setLink
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/links/LinkCommands/current
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/plugins
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/renderToolbar
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/runMenuItem
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function pickAndSetLink(): Promise<void>`

# Calls

- [editable](../../../functions/webview/editor/editable.md)
- [setLink](../../../functions/src/shared/editor/links/LinkCommands/setLink.md)
- [current](../../../functions/src/shared/editor/links/LinkCommands/current.md)

# Called by

- [plugins](../../../functions/webview/editor/plugins.md)
- [renderToolbar](../../../functions/webview/editor/renderToolbar.md)
- [runMenuItem](../../../functions/webview/editor/runMenuItem.md)