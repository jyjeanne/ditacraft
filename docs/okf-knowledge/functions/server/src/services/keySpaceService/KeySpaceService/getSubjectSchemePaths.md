---
type: TypeScript Method
title: getSubjectSchemePaths
resource: server/src/services/keySpaceService.ts#L474-L484
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/batchMetadata/processFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/ditavalConditions/handleGetSubjectSchemeAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public async getSubjectSchemePaths( contextFilePath: string ): Promise<string[]>`

# Called by

- [processFile](../../../../../../functions/server/src/features/batchMetadata/processFile.md)
- [handleGetSubjectSchemeAttributes](../../../../../../functions/server/src/features/ditavalConditions/handleGetSubjectSchemeAttributes.md)
- [runPipeline](../../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline.md)