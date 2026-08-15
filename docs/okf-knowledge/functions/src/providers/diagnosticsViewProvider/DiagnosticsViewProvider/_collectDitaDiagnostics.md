---
type: TypeScript Method
title: _collectDitaDiagnostics
resource: src/providers/diagnosticsViewProvider.ts#L107-L128
visibility: private
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/constants/isDitaUri
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/getChildren
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private _collectDitaDiagnostics(): Array<{ uri: vscode.Uri; diagnostic: vscode.Diagnostic }>`

# Calls

- [isDitaUri](../../../../../functions/src/utils/constants/isDitaUri.md)

# Called by

- [getChildren](../../../../../functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/getChildren.md)