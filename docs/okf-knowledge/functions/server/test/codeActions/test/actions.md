---
type: TypeScript Function
title: actions
resource: server/test/codeActions.test.ts#L23-L34
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/test/helper/createDoc
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/helper/createDocs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/codeActions/handleCodeActions
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function actions(content: string, diagnostics: Diagnostic[])`

# Calls

- [createDoc](../../../../../functions/server/test/helper/createDoc.md)
- [createDocs](../../../../../functions/server/test/helper/createDocs.md)
- [handleCodeActions](../../../../../functions/server/src/features/codeActions/handleCodeActions.md)