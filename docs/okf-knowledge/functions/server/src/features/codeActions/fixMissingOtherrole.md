---
type: TypeScript Function
title: fixMissingOtherrole
resource: server/src/features/codeActions.ts#L306-L333
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/codeActions/getFixesForDiagnostic
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function fixMissingOtherrole( diagnostic: Diagnostic, text: string, document: TextDocument ): CodeAction[]`

# Called by

- [getFixesForDiagnostic](../../../../../functions/server/src/features/codeActions/getFixesForDiagnostic.md)