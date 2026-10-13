---
type: TypeScript Method
title: _convertLocalResourcesAsync
resource: src/providers/previewPanel.ts#L635-L688
visibility: private
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_getHtmlForWebviewAsync
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async _convertLocalResourcesAsync(html: string, baseDir: string, webview: vscode.Webview): Promise<string>`

# Calls

- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [_getHtmlForWebviewAsync](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_getHtmlForWebviewAsync.md)