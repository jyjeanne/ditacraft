---
type: TypeScript Method
title: _groupByFile
resource: src/providers/diagnosticsViewProvider.ts#L130-L179
visibility: private
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/getChildren
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private _groupByFile(items: Array<{ uri: vscode.Uri; diagnostic: vscode.Diagnostic }>): DiagnosticItem[]`

# Called by

- [getChildren](../../../../../functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/getChildren.md)