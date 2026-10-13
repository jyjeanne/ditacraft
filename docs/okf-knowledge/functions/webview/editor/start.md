---
type: TypeScript Function
title: start
resource: webview/editor/main.ts#L493-L554
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/schema/buildEditorSchema
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/labels/labelsFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/openRowTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/addReference
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/pickRowTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/pauseMessage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/build
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/isMapDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/plugins
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/clipboardSerializer
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/clipboardParser
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/pasteImages
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/dropImages
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/reusedView/resolvedNodeViews
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/mapNodeViews
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
  - target: functions/webview/editor/updateUi
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/scheduleSelectionReport
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/docs/user-guide/build/gradle/runDitaOt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/languageClient/startLanguageClient
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/movable
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function start(message: Extract<HostToEditor, { type: 'init' }>): void`

# Calls

- [buildEditorSchema](../../../functions/src/shared/editor/schema/buildEditorSchema.md)
- [labelsFor](../../../functions/src/shared/render/labels/labelsFor.md)
- [openRowTarget](../../../functions/webview/editor/openRowTarget.md)
- [addReference](../../../functions/webview/editor/addReference.md)
- [pickRowTarget](../../../functions/webview/editor/pickRowTarget.md)
- [pauseMessage](../../../functions/webview/editor/pauseMessage.md)
- [build](../../../functions/webview/editor/build.md)
- [isMapDocument](../../../functions/src/shared/editor/maps/isMapDocument.md)
- [plugins](../../../functions/webview/editor/plugins.md)
- [clipboardSerializer](../../../functions/webview/editor/clipboardSerializer.md)
- [clipboardParser](../../../functions/webview/editor/clipboardParser.md)
- [pasteImages](../../../functions/webview/editor/pasteImages.md)
- [dropImages](../../../functions/webview/editor/dropImages.md)
- [resolvedNodeViews](../../../functions/webview/editor/reusedView/resolvedNodeViews.md)
- [mapNodeViews](../../../functions/webview/editor/mapView/mapNodeViews.md)
- [fixMapSelection](../../../functions/webview/editor/fixMapSelection.md)
- [showProblems](../../../functions/webview/editor/showProblems.md)
- [showResolved](../../../functions/webview/editor/showResolved.md)
- [updateUi](../../../functions/webview/editor/updateUi.md)
- [scheduleSelectionReport](../../../functions/webview/editor/scheduleSelectionReport.md)

# Called by

- [runDitaOt](../../../functions/docs/user-guide/build/gradle/runDitaOt.md)
- [startLanguageClient](../../../functions/src/languageClient/startLanguageClient.md)
- [movable](../../../functions/src/shared/editor/mapCommands/MapCommands/movable.md)