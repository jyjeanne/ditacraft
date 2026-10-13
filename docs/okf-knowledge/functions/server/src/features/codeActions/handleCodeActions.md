---
type: TypeScript Function
title: handleCodeActions
resource: server/src/features/codeActions.ts#L40-L62
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/codeActions/getFixesForDiagnostic
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/test/codeActions/test/actions
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function handleCodeActions( params: CodeActionParams, documents: TextDocuments<TextDocument> ): CodeAction[]`

# Calls

- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [getFixesForDiagnostic](../../../../../functions/server/src/features/codeActions/getFixesForDiagnostic.md)

# Called by

- [actions](../../../../../functions/server/test/codeActions/test/actions.md)