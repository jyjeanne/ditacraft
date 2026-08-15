---
type: TypeScript Function
title: fixEmptyElement
resource: server/src/features/codeActions.ts#L212-L255
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/codeActions/getFixesForDiagnostic
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function fixEmptyElement( diagnostic: Diagnostic, text: string, document: TextDocument ): CodeAction[]`

# Called by

- [getFixesForDiagnostic](../../../../../functions/server/src/features/codeActions/getFixesForDiagnostic.md)