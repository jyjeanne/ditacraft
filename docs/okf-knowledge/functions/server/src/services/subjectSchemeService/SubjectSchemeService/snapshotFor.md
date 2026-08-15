---
type: TypeScript Method
title: snapshotFor
resource: server/src/services/subjectSchemeService.ts#L179-L191
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/subjectSchemeService/SubjectSchemeService/mergeSchemes
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/batchMetadata/processFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`snapshotFor(schemePaths: string[]): SubjectSchemeQueries`

# Calls

- [get](../../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [mergeSchemes](../../../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/mergeSchemes.md)

# Called by

- [processFile](../../../../../../functions/server/src/features/batchMetadata/processFile.md)
- [runPipeline](../../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline.md)