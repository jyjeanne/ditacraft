---
type: TypeScript Function
title: fixMissingId
resource: server/src/features/codeActions.ts#L153-L181
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/codeActions/getFixesForDiagnostic
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function fixMissingId(text: string, document: TextDocument): CodeAction[]`

# Called by

- [getFixesForDiagnostic](../../../../../functions/server/src/features/codeActions/getFixesForDiagnostic.md)