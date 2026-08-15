---
type: TypeScript Function
title: navigateToElement
resource: src/utils/elementNavigator.ts#L42-L87
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/logger/Logger/debug
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/elementNavigator/findElementById
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/elementNavigator/showDocumentAtLine
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/info
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

- [debug](../../../../functions/src/utils/logger/Logger/debug.md)
- [findElementById](../../../../functions/src/utils/elementNavigator/findElementById.md)
- [showDocumentAtLine](../../../../functions/src/utils/elementNavigator/showDocumentAtLine.md)
- [info](../../../../functions/src/utils/logger/Logger/info.md)
- [warn](../../../../functions/src/utils/logger/Logger/warn.md)

# Called by

- [registerElementNavigationCommand](../../../../functions/src/utils/elementNavigator/registerElementNavigationCommand.md)