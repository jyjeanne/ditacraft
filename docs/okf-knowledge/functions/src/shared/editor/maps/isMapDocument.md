---
type: TypeScript Function
title: isMapDocument
resource: src/shared/editor/maps.ts#L85-L88
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/shared/editor/maps/hiddenMetadataSelection
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/start
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/rebuild
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/mapPlugin
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isMapDocument(doc: PMNode, es: EditorSchema): boolean`

# Called by

- [hiddenMetadataSelection](../../../../../functions/src/shared/editor/maps/hiddenMetadataSelection.md)
- [start](../../../../../functions/webview/editor/start.md)
- [rebuild](../../../../../functions/webview/editor/rebuild.md)
- [mapPlugin](../../../../../functions/webview/editor/mapView/mapPlugin.md)