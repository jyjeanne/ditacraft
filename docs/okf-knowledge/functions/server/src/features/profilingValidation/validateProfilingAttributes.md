---
type: TypeScript Function
title: validateProfilingAttributes
resource: server/src/features/profilingValidation.ts#L31-L92
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/stripCommentsAndCodeContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/escapeRegex
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/offsetToRange
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/i18n/t
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function validateProfilingAttributes( text: string, subjectSchemeService: SubjectSchemeQueries, maxProblems: number ): Diagnostic[]`

# Calls

- [stripCommentsAndCodeContent](../../../../../functions/server/src/utils/textUtils/stripCommentsAndCodeContent.md)
- [escapeRegex](../../../../../functions/server/src/utils/textUtils/escapeRegex.md)
- [offsetToRange](../../../../../functions/server/src/utils/textUtils/offsetToRange.md)
- [t](../../../../../functions/server/src/utils/i18n/t.md)

# Called by

- [runPipeline](../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline.md)