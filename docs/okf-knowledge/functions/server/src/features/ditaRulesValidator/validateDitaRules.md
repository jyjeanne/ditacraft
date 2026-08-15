---
type: TypeScript Function
title: validateDitaRules
resource: server/src/features/ditaRulesValidator.ts#L990-L1010
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/ditaRulesValidator/test/validate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function validateDitaRules( text: string, settings: DitaRulesSettings = DEFAULT_SETTINGS ): Diagnostic[]`

# Called by

- [runPipeline](../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline.md)
- [validate](../../../../../functions/server/test/ditaRulesValidator/test/validate.md)