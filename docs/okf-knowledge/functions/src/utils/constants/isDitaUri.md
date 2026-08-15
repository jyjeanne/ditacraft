---
type: TypeScript Function
title: isDitaUri
resource: src/utils/constants.ts#L111-L113
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/_collectDitaDiagnostics
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaFileDecorationProvider/DitaFileDecorationProvider/provideFileDecoration
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isDitaUri(uri: import('vscode').Uri): boolean`

# Called by

- [_collectDitaDiagnostics](../../../../functions/src/providers/diagnosticsViewProvider/DiagnosticsViewProvider/_collectDitaDiagnostics.md)
- [provideFileDecoration](../../../../functions/src/providers/ditaFileDecorationProvider/DitaFileDecorationProvider/provideFileDecoration.md)