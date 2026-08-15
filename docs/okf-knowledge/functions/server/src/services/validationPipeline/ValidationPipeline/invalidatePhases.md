---
type: TypeScript Method
title: invalidatePhases
resource: server/src/services/validationPipeline.ts#L283-L287
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/cacheKey
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/invalidateForTextEdit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/invalidateForFileSave
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public invalidatePhases(uri: string, phases: ValidationPhase[]): void`

# Calls

- [cacheKey](../../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/cacheKey.md)

# Called by

- [invalidateForTextEdit](../../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/invalidateForTextEdit.md)
- [invalidateForFileSave](../../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/invalidateForFileSave.md)