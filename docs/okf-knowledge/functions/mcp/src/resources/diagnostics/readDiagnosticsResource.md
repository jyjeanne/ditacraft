---
type: TypeScript Function
title: readDiagnosticsResource
resource: mcp/src/resources/diagnostics.ts#L22-L38
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/mcp/src/resources/diagnostics/parseSeverities
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/resources/diagnostics/parseLimit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/diagnosticsStore/DiagnosticsStore/query
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/mcp/src/server/readDiagnostics
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function readDiagnosticsResource( params: Record<string, string>, ctx: McpContext, ): Promise<DiagnosticsResourceResult>`

# Calls

- [parseSeverities](../../../../../functions/mcp/src/resources/diagnostics/parseSeverities.md)
- [parseLimit](../../../../../functions/mcp/src/resources/diagnostics/parseLimit.md)
- [query](../../../../../functions/mcp/src/diagnosticsStore/DiagnosticsStore/query.md)

# Called by

- [readDiagnostics](../../../../../functions/mcp/src/server/readDiagnostics.md)