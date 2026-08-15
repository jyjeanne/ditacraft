---
type: TypeScript Method
title: query
resource: mcp/src/diagnosticsStore.ts#L24-L58
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/mcp/src/diagnosticsStore/matchGlob
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/diagnosticsStore/diagnosticSeverityLabel
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/mcp/src/resources/diagnostics/readDiagnosticsResource
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`query(options: QueryOptions = {}): { totalCount: number; diagnostics: StoredDiagnostic[] }`

# Calls

- [matchGlob](../../../../../functions/mcp/src/diagnosticsStore/matchGlob.md)
- [diagnosticSeverityLabel](../../../../../functions/mcp/src/diagnosticsStore/diagnosticSeverityLabel.md)

# Called by

- [readDiagnosticsResource](../../../../../functions/mcp/src/resources/diagnostics/readDiagnosticsResource.md)