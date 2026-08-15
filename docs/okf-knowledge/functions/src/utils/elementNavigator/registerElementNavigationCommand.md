---
type: TypeScript Function
title: registerElementNavigationCommand
resource: src/utils/elementNavigator.ts#L129-L141
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/elementNavigator/navigateToElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/info
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/activate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function registerElementNavigationCommand(context: vscode.ExtensionContext): void`

# Calls

- [navigateToElement](../../../../functions/src/utils/elementNavigator/navigateToElement.md)
- [info](../../../../functions/src/utils/logger/Logger/info.md)

# Called by

- [activate](../../../../functions/src/extension/activate.md)