---
type: TypeScript Function
title: registerPathFollowing
resource: src/extension.ts#L592-L620
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/commands/previewCommand/followActiveDitavalMove
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/pathSettings/followPathSettings
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/sendInitialRootMapSetting
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/followDitavalMoves
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function registerPathFollowing(context: vscode.ExtensionContext): void`

# Calls

- [followActiveDitavalMove](../../../functions/src/commands/previewCommand/followActiveDitavalMove.md)
- [followPathSettings](../../../functions/src/utils/pathSettings/followPathSettings.md)
- [sendInitialRootMapSetting](../../../functions/src/extension/sendInitialRootMapSetting.md)
- [followDitavalMoves](../../../functions/src/commands/publishProfilesCommand/followDitavalMoves.md)

# Called by

- [activate](../../../functions/src/extension/activate.md)