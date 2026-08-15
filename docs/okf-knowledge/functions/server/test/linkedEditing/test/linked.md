---
type: TypeScript Function
title: linked
resource: server/test/linkedEditing.test.ts#L5-L15
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
  - target: functions/server/src/features/linkedEditing/handleLinkedEditingRange
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function linked(content: string, line: number, character: number)`

# Calls

- [createDoc](../../../../../functions/server/test/helper/createDoc.md)
- [createDocs](../../../../../functions/server/test/helper/createDocs.md)
- [handleLinkedEditingRange](../../../../../functions/server/src/features/linkedEditing/handleLinkedEditingRange.md)