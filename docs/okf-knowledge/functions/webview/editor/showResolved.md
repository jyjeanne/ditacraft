---
type: TypeScript Function
title: showResolved
resource: webview/editor/main.ts#L253-L282
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/freshBuild
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/reused/resolvedTargets
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editor/test/nodeAt
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

`function showResolved(): void`

# Calls

- [freshBuild](../../../functions/webview/editor/freshBuild.md)
- [resolvedTargets](../../../functions/src/shared/editor/reused/resolvedTargets.md)
- [nodeAt](../../../functions/src/test/shared/editor/test/nodeAt.md)

# Called by

- [start](../../../functions/webview/editor/start.md)
- [rebuild](../../../functions/webview/editor/rebuild.md)