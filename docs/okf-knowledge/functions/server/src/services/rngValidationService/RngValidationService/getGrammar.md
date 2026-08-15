---
type: TypeScript Method
title: getGrammar
resource: server/src/services/rngValidationService.ts#L202-L226
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/rngValidationService/RngValidationService/compileGrammar
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/rngValidationService/RngValidationService/validate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private getGrammar(schemaPath: string): Promise<SalveGrammar | null>`

# Calls

- [get](../../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [compileGrammar](../../../../../../functions/server/src/services/rngValidationService/RngValidationService/compileGrammar.md)

# Called by

- [validate](../../../../../../functions/server/src/services/rngValidationService/RngValidationService/validate.md)