---
type: TypeScript Method
title: getCached
resource: server/src/services/validationPipeline.ts#L226-L241
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/cacheKey
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private getCached( uri: string, phase: ValidationPhase, documentVersion: number, settingsHash: string, checkVersion = true, ): Diagnostic[] | null`

# Calls

- [cacheKey](../../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/cacheKey.md)
- [get](../../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)

# Called by

- [runPipeline](../../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline.md)