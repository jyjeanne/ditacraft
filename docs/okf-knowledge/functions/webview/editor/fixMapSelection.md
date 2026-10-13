---
type: TypeScript Function
title: fixMapSelection
resource: webview/editor/main.ts#L1219-L1227
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/maps/hiddenMetadataSelection
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/start
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/rebuild
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/toggleMarkup
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function fixMapSelection(): void`

# Calls

- [hiddenMetadataSelection](../../../functions/src/shared/editor/maps/hiddenMetadataSelection.md)

# Called by

- [start](../../../functions/webview/editor/start.md)
- [rebuild](../../../functions/webview/editor/rebuild.md)
- [toggleMarkup](../../../functions/webview/editor/toggleMarkup.md)