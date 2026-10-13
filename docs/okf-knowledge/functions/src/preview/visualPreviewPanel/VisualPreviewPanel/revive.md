---
type: TypeScript Method
title: revive
resource: src/preview/visualPreviewPanel.ts#L172-L192
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/errorUtils/fireAndForget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/setDocument
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private static revive(panel: vscode.WebviewPanel, state: PersistedState): void`

# Calls

- [fireAndForget](../../../../../functions/src/utils/errorUtils/fireAndForget.md)
- [setDocument](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/setDocument.md)