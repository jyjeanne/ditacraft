---
type: TypeScript Function
title: validateXML
resource: server/src/features/validation.ts#L206-L256
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/validation/createRange
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

# Called by

- [validateDITADocument](../../../../../functions/server/src/features/validation/validateDITADocument.md)