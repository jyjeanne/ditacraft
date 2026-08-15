---
type: TypeScript Method
title: _groupByType
resource: src/providers/diagnosticsViewProvider.ts#L181-L248
visibility: private
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/getChildren
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private _groupByType(items: Array<{ uri: vscode.Uri; diagnostic: vscode.Diagnostic }>): DiagnosticItem[]`

# Called by

- [getChildren](../../../../../functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/getChildren.md)