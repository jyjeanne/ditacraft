---
type: TypeScript Function
title: scheduleRecompute
resource: src/providers/ditavalDecorationProvider.ts#L197-L205
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/providers/ditavalDecorationProvider/recompute
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/ditavalDecorationProvider/registerConditionHighlighting
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function scheduleRecompute(editor: vscode.TextEditor | undefined): void`

# Calls

- [recompute](../../../../functions/src/providers/ditavalDecorationProvider/recompute.md)

# Called by

- [registerConditionHighlighting](../../../../functions/src/providers/ditavalDecorationProvider/registerConditionHighlighting.md)