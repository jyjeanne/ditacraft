---
type: TypeScript Method
title: constructor
resource: src/providers/previewPanel.ts#L100-L172
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/errorUtils/fireAndForget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_handlePreviewScroll
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_handleSetTheme
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_setupEditorScrollSync
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/debug
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private constructor( panel: vscode.WebviewPanel, extensionUri: vscode.Uri, htmlFile?: string, sourceFile?: string, filterLabel?: string )`

# Calls

- [fireAndForget](../../../../../functions/src/utils/errorUtils/fireAndForget.md)
- [_handlePreviewScroll](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_handlePreviewScroll.md)
- [_handleSetTheme](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_handleSetTheme.md)
- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [_setupEditorScrollSync](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_setupEditorScrollSync.md)
- [debug](../../../../../functions/src/utils/logger/Logger/debug.md)