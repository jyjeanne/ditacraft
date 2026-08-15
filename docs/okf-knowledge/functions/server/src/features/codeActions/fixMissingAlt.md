---
type: TypeScript Function
title: fixMissingAlt
resource: server/src/features/codeActions.ts#L464-L514
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/codeActions/getFixesForDiagnostic
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function fixMissingAlt( diagnostic: Diagnostic, text: string, document: TextDocument ): CodeAction[]`

# Called by

- [getFixesForDiagnostic](../../../../../functions/server/src/features/codeActions/getFixesForDiagnostic.md)