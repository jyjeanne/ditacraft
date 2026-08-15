---
type: TypeScript Function
title: matchGlob
resource: mcp/src/diagnosticsStore.ts#L86-L91
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/mcp/src/diagnosticsStore/globToRegex
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/mcp/src/diagnosticsStore/DiagnosticsStore/query
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function matchGlob(uri: string, pattern: string): boolean`

# Calls

- [globToRegex](../../../../functions/mcp/src/diagnosticsStore/globToRegex.md)

# Called by

- [query](../../../../functions/mcp/src/diagnosticsStore/DiagnosticsStore/query.md)