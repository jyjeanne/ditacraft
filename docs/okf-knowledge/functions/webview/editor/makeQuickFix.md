---
type: TypeScript Function
title: makeQuickFix
resource: webview/editor/main.ts#L1300-L1338
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/editable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/noteStatus
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/labels/format
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/freshBuild
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/sourceChange/sourceChangeTransaction
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/build
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/showQuickFixes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/debug
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function makeQuickFix(id: number, title: string): Promise<void>`

# Calls

- [editable](../../../functions/webview/editor/editable.md)
- [noteStatus](../../../functions/webview/editor/noteStatus.md)
- [format](../../../functions/src/shared/render/labels/format.md)
- [freshBuild](../../../functions/webview/editor/freshBuild.md)
- [sourceChangeTransaction](../../../functions/src/shared/editor/sourceChange/sourceChangeTransaction.md)
- [build](../../../functions/webview/editor/build.md)

# Called by

- [showQuickFixes](../../../functions/webview/editor/showQuickFixes.md)
- [debug](../../../functions/webview/editor/debug.md)