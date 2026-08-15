---
type: TypeScript Method
title: validate
resource: server/src/services/rngValidationService.ts#L148-L166
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/services/rngValidationService/RngValidationService/resolveSchemaPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/rngValidationService/RngValidationService/getGrammar
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/rngValidationService/RngValidationService/validateWithGrammar
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async validate(text: string): Promise<Diagnostic[]>`

# Calls

- [resolveSchemaPath](../../../../../../functions/server/src/services/rngValidationService/RngValidationService/resolveSchemaPath.md)
- [getGrammar](../../../../../../functions/server/src/services/rngValidationService/RngValidationService/getGrammar.md)
- [validateWithGrammar](../../../../../../functions/server/src/services/rngValidationService/RngValidationService/validateWithGrammar.md)