---
type: TypeScript Function
title: validateDitaRules
resource: server/src/features/ditaRulesValidator.ts#L990-L1010
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/test/shared/editorTables/test/check
    resolved_by: tree-sitter
    confidence: exact
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

# Calls

- [check](../../../../../functions/src/test/shared/editorTables/test/check.md)

# Called by

- [runPipeline](../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline.md)
- [validate](../../../../../functions/server/test/ditaRulesValidator/test/validate.md)