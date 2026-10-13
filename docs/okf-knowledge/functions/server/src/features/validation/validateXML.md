---
type: TypeScript Function
title: validateXML
resource: server/src/features/validation.ts#L300-L350
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/features/validation/createRange
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/validation/validateDITADocument
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function validateXML(text: string, diagnostics: Diagnostic[]): void`

# Calls

- [createRange](../../../../../functions/server/src/features/validation/createRange.md)
- [match](../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)

# Called by

- [validateDITADocument](../../../../../functions/server/src/features/validation/validateDITADocument.md)