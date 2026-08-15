---
type: TypeScript Function
title: registerConditionHighlighting
resource: src/providers/ditavalDecorationProvider.ts#L147-L182
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/providers/ditavalDecorationProvider/scheduleRecompute
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/onConfigurationChange
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function registerConditionHighlighting(context: vscode.ExtensionContext): void`

# Calls

- [scheduleRecompute](../../../../functions/src/providers/ditavalDecorationProvider/scheduleRecompute.md)
- [onConfigurationChange](../../../../functions/src/utils/configurationManager/ConfigurationManager/onConfigurationChange.md)

# Called by

- [activate](../../../../functions/src/extension/activate.md)