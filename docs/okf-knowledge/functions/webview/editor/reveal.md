---
type: TypeScript Function
title: reveal
resource: webview/editor/main.ts#L426-L455
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/freshBuild
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/scrollToPosition
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editor/test/nodeAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/isMapRow
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function reveal(message: Extract<HostToEditor, { type: 'reveal' }>): void`

# Calls

- [freshBuild](../../../functions/webview/editor/freshBuild.md)
- [scrollToPosition](../../../functions/webview/editor/scrollToPosition.md)
- [nodeAt](../../../functions/src/test/shared/editor/test/nodeAt.md)
- [isMapRow](../../../functions/src/shared/editor/maps/isMapRow.md)