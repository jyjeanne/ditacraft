---
type: TypeScript Function
title: openRowTarget
resource: webview/editor/main.ts#L1127-L1137
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/freshBuild
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/start
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/runMenuItem
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function openRowTarget(target: MapRowTarget, pos?: number): void`

# Calls

- [freshBuild](../../../functions/webview/editor/freshBuild.md)

# Called by

- [start](../../../functions/webview/editor/start.md)
- [runMenuItem](../../../functions/webview/editor/runMenuItem.md)