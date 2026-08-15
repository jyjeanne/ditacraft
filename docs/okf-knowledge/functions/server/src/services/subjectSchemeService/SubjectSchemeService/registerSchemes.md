---
type: TypeScript Method
title: registerSchemes
resource: server/src/services/subjectSchemeService.ts#L107-L117
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/batchMetadata/test/createSchemeService
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/profilingValidation/test/createSchemeService
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`registerSchemes(schemePaths: string[]): void`

# Called by

- [runPipeline](../../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline.md)
- [createSchemeService](../../../../../../functions/server/test/batchMetadata/test/createSchemeService.md)
- [createSchemeService](../../../../../../functions/server/test/profilingValidation/test/createSchemeService.md)