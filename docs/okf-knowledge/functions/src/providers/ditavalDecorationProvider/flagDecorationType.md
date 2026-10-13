---
type: TypeScript Function
title: flagDecorationType
resource: src/providers/ditavalDecorationProvider.ts#L56-L74
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/conditionMarks/flagLook
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalDecorationProvider/flagAttachment
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/ditavalDecorationProvider/recompute
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function flagDecorationType(key: string, style: FlagStyle): vscode.TextEditorDecorationType`

# Calls

- [flagLook](../../../../functions/src/preview/conditionMarks/flagLook.md)
- [flagAttachment](../../../../functions/src/providers/ditavalDecorationProvider/flagAttachment.md)

# Called by

- [recompute](../../../../functions/src/providers/ditavalDecorationProvider/recompute.md)