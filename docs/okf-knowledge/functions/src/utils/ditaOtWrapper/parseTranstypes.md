---
type: TypeScript Function
title: parseTranstypes
resource: src/utils/ditaOtWrapper.ts#L52-L61
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/getAvailableTranstypes
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function parseTranstypes(stdout: string): string[]`

# Calls

- [match](../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)

# Called by

- [getAvailableTranstypes](../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/getAvailableTranstypes.md)