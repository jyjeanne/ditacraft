---
type: TypeScript Function
title: navigateToElement
resource: src/utils/elementNavigator.ts#L42-L87
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/elementNavigator/showDocumentAtLine
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/warn
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/utils/elementNavigator/registerElementNavigationCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function navigateToElement( documentUri: vscode.Uri, elementPath: string ): Promise<boolean>`

# Calls

- [showDocumentAtLine](../../../../functions/src/utils/elementNavigator/showDocumentAtLine.md)
- [warn](../../../../functions/src/utils/logger/Logger/warn.md)

# Called by

- [registerElementNavigationCommand](../../../../functions/src/utils/elementNavigator/registerElementNavigationCommand.md)