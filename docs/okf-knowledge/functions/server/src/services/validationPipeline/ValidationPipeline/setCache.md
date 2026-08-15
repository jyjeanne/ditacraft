---
type: TypeScript Method
title: setCache
resource: server/src/services/validationPipeline.ts#L243-L257
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/evictOldest
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/cacheKey
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private setCache( uri: string, phase: ValidationPhase, documentVersion: number, settingsHash: string, diagnostics: Diagnostic[], ): void`

# Calls

- [evictOldest](../../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/evictOldest.md)
- [cacheKey](../../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/cacheKey.md)

# Called by

- [runPipeline](../../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline.md)