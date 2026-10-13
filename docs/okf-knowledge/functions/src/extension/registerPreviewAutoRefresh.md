---
type: TypeScript Function
title: registerPreviewAutoRefresh
resource: src/extension.ts#L756-L799
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/commands/previewCommand/shouldAutoRefreshPreview
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/getSourceFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/previewCommand/isPreviewRefreshInFlight
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/errorUtils/fireAndForget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/previewCommand/requestPreviewRefresh
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function registerPreviewAutoRefresh(context: vscode.ExtensionContext): void`

# Calls

- [shouldAutoRefreshPreview](../../../functions/src/commands/previewCommand/shouldAutoRefreshPreview.md)
- [getSourceFile](../../../functions/src/providers/previewPanel/DitaPreviewPanel/getSourceFile.md)
- [isPreviewRefreshInFlight](../../../functions/src/commands/previewCommand/isPreviewRefreshInFlight.md)
- [fireAndForget](../../../functions/src/utils/errorUtils/fireAndForget.md)
- [requestPreviewRefresh](../../../functions/src/commands/previewCommand/requestPreviewRefresh.md)

# Called by

- [activate](../../../functions/src/extension/activate.md)