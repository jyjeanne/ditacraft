---
type: TypeScript Function
title: lookupErrorCode
resource: src/utils/ditaOtErrorCodes.ts#L236-L238
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/commands/validateGuideCommand/mapToValidationIssues
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function lookupErrorCode(code: string): DitaOtCodeInfo | undefined`

# Called by

- [mapToValidationIssues](../../../../functions/src/commands/validateGuideCommand/mapToValidationIssues.md)