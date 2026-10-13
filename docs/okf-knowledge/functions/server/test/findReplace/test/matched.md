---
type: TypeScript Function
title: matched
resource: server/test/findReplace.test.ts#L390-L396
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/features/findReplace/handleComputeFindReplaceEdits
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/helper/createDocs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/helper/createDoc
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function matched(content: string, params: Partial<typeof baseParams> & { includeAttributeValues?: boolean }): Promise<string[]>`

# Calls

- [handleComputeFindReplaceEdits](../../../../../functions/server/src/features/findReplace/handleComputeFindReplaceEdits.md)
- [createDocs](../../../../../functions/server/test/helper/createDocs.md)
- [createDoc](../../../../../functions/server/test/helper/createDoc.md)