---
type: TypeScript Method
title: errorToDiagnostic
resource: server/src/services/catalogValidationService.ts#L173-L211
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/catalogValidationService/CatalogValidationService/validate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private errorToDiagnostic(error: unknown): Diagnostic`

# Calls

- [match](../../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)

# Called by

- [validate](../../../../../../functions/server/src/services/catalogValidationService/CatalogValidationService/validate.md)