---
type: TypeScript Method
title: compileGrammar
resource: server/src/services/rngValidationService.ts#L229-L259
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/services/rngValidationService/RngValidationService/getGrammar
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async compileGrammar(schemaPath: string): Promise<SalveGrammar | null>`

# Called by

- [getGrammar](../../../../../../functions/server/src/services/rngValidationService/RngValidationService/getGrammar.md)