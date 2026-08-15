---
type: TypeScript Function
title: fixInvalidIdFormat
resource: server/src/features/codeActions.ts#L520-L560
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/codeActions/getFixesForDiagnostic
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function fixInvalidIdFormat( diagnostic: Diagnostic, text: string, document: TextDocument ): CodeAction[]`

# Called by

- [getFixesForDiagnostic](../../../../../functions/server/src/features/codeActions/getFixesForDiagnostic.md)