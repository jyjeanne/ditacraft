---
type: TypeScript Function
title: makeDiag
resource: server/src/features/ditaRulesValidator.ts#L1016-L1027
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/offsetToRange
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function makeDiag( text: string, offset: number, length: number, message: string, severity: DiagnosticSeverity, code: string ): Diagnostic`

# Calls

- [offsetToRange](../../../../../functions/server/src/utils/textUtils/offsetToRange.md)