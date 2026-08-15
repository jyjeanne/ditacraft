---
type: TypeScript Method
title: _groupByFile
resource: src/providers/diagnosticsViewProvider.ts#L130-L179
visibility: private
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/getChildren
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private _groupByFile(items: Array<{ uri: vscode.Uri; diagnostic: vscode.Diagnostic }>): DiagnosticItem[]`

# Calls

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)

# Called by

- [getChildren](../../../../../functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/getChildren.md)