---
type: TypeScript Method
title: cacheKey
resource: server/src/services/validationPipeline.ts#L205-L207
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/getCached
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/setCache
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/invalidatePhases
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private cacheKey(uri: string, phase: ValidationPhase): string`

# Called by

- [getCached](../../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/getCached.md)
- [setCache](../../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/setCache.md)
- [invalidatePhases](../../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/invalidatePhases.md)