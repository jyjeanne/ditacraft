---
type: TypeScript Function
title: scheduleRecompute
resource: src/providers/ditavalDecorationProvider.ts#L133-L141
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/providers/ditavalDecorationProvider/recompute
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/debug
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
- [debug](../../../../functions/src/utils/logger/Logger/debug.md)

# Called by

- [registerConditionHighlighting](../../../../functions/src/providers/ditavalDecorationProvider/registerConditionHighlighting.md)