---
type: TypeScript Method
title: onConfigurationChange
resource: src/utils/configurationManager.ts#L371-L376
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/extension/registerConfigurationListener
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalDecorationProvider/registerConditionHighlighting
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public onConfigurationChange(listener: ConfigurationChangeListener): vscode.Disposable`

# Called by

- [registerConfigurationListener](../../../../../functions/src/extension/registerConfigurationListener.md)
- [registerConditionHighlighting](../../../../../functions/src/providers/ditavalDecorationProvider/registerConditionHighlighting.md)