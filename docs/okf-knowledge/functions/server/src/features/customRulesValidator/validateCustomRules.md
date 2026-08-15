---
type: TypeScript Function
title: validateCustomRules
resource: server/src/features/customRulesValidator.ts#L213-L260
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/customRulesValidator/loadRules
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/customRulesValidator/detectFileType
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/warn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/offsetToRange
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function validateCustomRules( text: string, filePath: string, rulesFile: string, maxProblems: number, ): Diagnostic[]`

# Calls

- [loadRules](../../../../../functions/server/src/features/customRulesValidator/loadRules.md)
- [detectFileType](../../../../../functions/server/src/features/customRulesValidator/detectFileType.md)
- [warn](../../../../../functions/src/utils/logger/Logger/warn.md)
- [offsetToRange](../../../../../functions/server/src/utils/textUtils/offsetToRange.md)

# Called by

- [runPipeline](../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline.md)