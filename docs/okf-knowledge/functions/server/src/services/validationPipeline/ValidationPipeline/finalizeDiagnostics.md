---
type: TypeScript Method
title: finalizeDiagnostics
resource: server/src/services/validationPipeline.ts#L686-L718
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/services/suppressionEngine/applySuppressions
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private finalizeDiagnostics( diagnostics: Diagnostic[], settings: DitaCraftSettings, text: string, ): Diagnostic[]`

# Calls

- [applySuppressions](../../../../../../functions/server/src/services/suppressionEngine/applySuppressions.md)

# Called by

- [runPipeline](../../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline.md)