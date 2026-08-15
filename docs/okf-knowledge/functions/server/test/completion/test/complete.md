---
type: TypeScript Function
title: complete
resource: server/test/completion.test.ts#L10-L20
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
  - target: functions/server/src/features/completion/handleCompletion
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function complete(content: string, line: number, character: number)`

# Calls

- [createDoc](../../../../../functions/server/test/helper/createDoc.md)
- [createDocs](../../../../../functions/server/test/helper/createDocs.md)
- [handleCompletion](../../../../../functions/server/src/features/completion/handleCompletion.md)