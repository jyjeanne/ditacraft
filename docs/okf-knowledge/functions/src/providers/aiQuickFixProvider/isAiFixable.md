---
type: TypeScript Function
title: isAiFixable
resource: src/providers/aiQuickFixProvider.ts#L151-L159
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/aiQuickFixProvider/AIQuickFixProvider/provideCodeActions
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isAiFixable(diagnostic: vscode.Diagnostic): boolean`

# Calls

- [has](../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [provideCodeActions](../../../../functions/src/providers/aiQuickFixProvider/AIQuickFixProvider/provideCodeActions.md)