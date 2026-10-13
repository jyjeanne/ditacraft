---
type: TypeScript Function
title: rebuild
resource: webview/editor/main.ts#L565-L603
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/pauseMessage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/updateUi
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/build
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/foldPaths
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/plugins
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/isMapDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/restoreFolds
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/fixMapSelection
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/showProblems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/showResolved
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/scheduleSelectionReport
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function rebuild(text: string): void`

# Calls

- [pauseMessage](../../../functions/webview/editor/pauseMessage.md)
- [updateUi](../../../functions/webview/editor/updateUi.md)
- [build](../../../functions/webview/editor/build.md)
- [foldPaths](../../../functions/webview/editor/mapView/foldPaths.md)
- [plugins](../../../functions/webview/editor/plugins.md)
- [isMapDocument](../../../functions/src/shared/editor/maps/isMapDocument.md)
- [restoreFolds](../../../functions/webview/editor/mapView/restoreFolds.md)
- [fixMapSelection](../../../functions/webview/editor/fixMapSelection.md)
- [showProblems](../../../functions/webview/editor/showProblems.md)
- [showResolved](../../../functions/webview/editor/showResolved.md)
- [scheduleSelectionReport](../../../functions/webview/editor/scheduleSelectionReport.md)