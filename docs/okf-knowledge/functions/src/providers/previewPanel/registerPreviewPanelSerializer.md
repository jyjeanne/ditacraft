---
type: TypeScript Function
title: registerPreviewPanelSerializer
resource: src/providers/previewPanel.ts#L1057-L1065
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/revive
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function registerPreviewPanelSerializer(context: vscode.ExtensionContext): void`

# Calls

- [revive](../../../../functions/src/providers/previewPanel/DitaPreviewPanel/revive.md)

# Called by

- [activate](../../../../functions/src/extension/activate.md)