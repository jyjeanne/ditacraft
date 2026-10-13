---
type: TypeScript Function
title: queryParameters
resource: mcp/src/resources/query.ts#L44-L53
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/mcp/src/resources/query/invalidParameter
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/mcp/src/server/readDiagnostics
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/server/readKeys
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function queryParameters(uri: URL, base: string, names: readonly string[]): Record<string, string>`

# Calls

- [invalidParameter](../../../../../functions/mcp/src/resources/query/invalidParameter.md)

# Called by

- [readDiagnostics](../../../../../functions/mcp/src/server/readDiagnostics.md)
- [readKeys](../../../../../functions/mcp/src/server/readKeys.md)