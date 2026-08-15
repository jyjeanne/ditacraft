---
type: TypeScript Function
title: applySuppressions
resource: server/src/services/suppressionEngine.ts#L129-L151
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/services/suppressionEngine/parseSuppressions
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/finalizeDiagnostics
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function applySuppressions(diagnostics: Diagnostic[], text: string): Diagnostic[]`

# Calls

- [parseSuppressions](../../../../../functions/server/src/services/suppressionEngine/parseSuppressions.md)

# Called by

- [finalizeDiagnostics](../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/finalizeDiagnostics.md)