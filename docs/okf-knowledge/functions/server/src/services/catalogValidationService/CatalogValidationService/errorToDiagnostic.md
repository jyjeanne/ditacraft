---
type: TypeScript Method
title: errorToDiagnostic
resource: server/src/services/catalogValidationService.ts#L173-L211
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/i18n/t
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

- [t](../../../../../../functions/server/src/utils/i18n/t.md)

# Called by

- [validate](../../../../../../functions/server/src/services/catalogValidationService/CatalogValidationService/validate.md)