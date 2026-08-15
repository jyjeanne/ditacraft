---
type: TypeScript Method
title: getChildren
resource: src/providers/diagnosticsViewProvider.ts#L92-L105
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/_collectDitaDiagnostics
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/_groupByFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/_groupByType
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async getChildren(element?: DiagnosticItem): Promise<DiagnosticItem[]>`

# Calls

- [_collectDitaDiagnostics](../../../../../functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/_collectDitaDiagnostics.md)
- [_groupByFile](../../../../../functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/_groupByFile.md)
- [_groupByType](../../../../../functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/_groupByType.md)