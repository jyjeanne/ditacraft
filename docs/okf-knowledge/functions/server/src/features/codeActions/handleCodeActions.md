---
type: TypeScript Function
title: handleCodeActions
resource: server/src/features/codeActions.ts#L40-L62
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
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

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [getFixesForDiagnostic](../../../../../functions/server/src/features/codeActions/getFixesForDiagnostic.md)

# Called by

- [actions](../../../../../functions/server/test/codeActions/test/actions.md)