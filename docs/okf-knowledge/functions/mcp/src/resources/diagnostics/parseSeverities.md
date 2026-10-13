---
type: TypeScript Function
title: parseSeverities
resource: mcp/src/resources/diagnostics.ts#L41-L49
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/mcp/src/resources/query/invalidParameter
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/mcp/src/resources/diagnostics/readDiagnosticsResource
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function parseSeverities(value: string): string[]`

# Calls

- [invalidParameter](../../../../../functions/mcp/src/resources/query/invalidParameter.md)

# Called by

- [readDiagnosticsResource](../../../../../functions/mcp/src/resources/diagnostics/readDiagnosticsResource.md)