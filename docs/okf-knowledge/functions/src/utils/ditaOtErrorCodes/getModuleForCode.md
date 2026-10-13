---
type: TypeScript Function
title: getModuleForCode
resource: src/utils/ditaOtErrorCodes.ts#L244-L256
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/validateGuideCommand/mapToValidationIssues
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function getModuleForCode(code: string): DitaOtModule | undefined`

# Calls

- [startsWith](../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [mapToValidationIssues](../../../../functions/src/commands/validateGuideCommand/mapToValidationIssues.md)