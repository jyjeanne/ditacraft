---
type: TypeScript Function
title: createUnusedTopicDiagnostic
resource: server/src/features/workspaceValidation.ts#L283-L291
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/i18n/t
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function createUnusedTopicDiagnostic(): Diagnostic`

# Calls

- [t](../../../../../functions/server/src/utils/i18n/t.md)

# Called by

- [runPipeline](../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline.md)