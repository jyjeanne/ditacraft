---
type: TypeScript Function
title: mapToValidationIssues
resource: src/commands/validateGuideCommand.ts#L223-L245
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/ditaOtErrorCodes/lookupErrorCode
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtErrorCodes/getModuleForCode
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/validateGuideCommand/executeValidation
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function mapToValidationIssues( errors: DitaOtError[], baseDir: string ): ValidationIssue[]`

# Calls

- [lookupErrorCode](../../../../functions/src/utils/ditaOtErrorCodes/lookupErrorCode.md)
- [getModuleForCode](../../../../functions/src/utils/ditaOtErrorCodes/getModuleForCode.md)

# Called by

- [executeValidation](../../../../functions/src/commands/validateGuideCommand/executeValidation.md)