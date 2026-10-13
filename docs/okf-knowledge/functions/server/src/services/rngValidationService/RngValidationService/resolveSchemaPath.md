---
type: TypeScript Method
title: resolveSchemaPath
resource: server/src/services/rngValidationService.ts#L177-L195
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/rngValidationService/RngValidationService/validate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private resolveSchemaPath(text: string): string | null`

# Calls

- [match](../../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)

# Called by

- [validate](../../../../../../functions/server/src/services/rngValidationService/RngValidationService/validate.md)