---
type: TypeScript Function
title: invalidParameter
resource: mcp/src/resources/query.ts#L39-L41
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/mcp/src/resources/diagnostics/parseSeverities
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/resources/diagnostics/parseLimit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/resources/keys/readKeysResource
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/resources/query/queryParameters
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function invalidParameter(message: string): McpError`

# Called by

- [parseSeverities](../../../../../functions/mcp/src/resources/diagnostics/parseSeverities.md)
- [parseLimit](../../../../../functions/mcp/src/resources/diagnostics/parseLimit.md)
- [readKeysResource](../../../../../functions/mcp/src/resources/keys/readKeysResource.md)
- [queryParameters](../../../../../functions/mcp/src/resources/query/queryParameters.md)