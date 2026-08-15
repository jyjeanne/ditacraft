---
type: TypeScript Method
title: _getHtmlForWebviewAsync
resource: src/providers/previewPanel.ts#L598-L629
visibility: private
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_getNoContentHtml
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_convertLocalResourcesAsync
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_injectPreviewEnhancementsAsync
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_update
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async _getHtmlForWebviewAsync(webview: vscode.Webview): Promise<string>`

# Calls

- [_getNoContentHtml](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_getNoContentHtml.md)
- [_convertLocalResourcesAsync](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_convertLocalResourcesAsync.md)
- [_injectPreviewEnhancementsAsync](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_injectPreviewEnhancementsAsync.md)

# Called by

- [_update](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_update.md)