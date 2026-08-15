---
type: TypeScript Function
title: hover
resource: server/test/hover.test.ts#L10-L20
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
  - target: functions/server/src/features/hover/handleHover
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function hover(content: string, line: number, character: number)`

# Calls

- [createDoc](../../../../../functions/server/test/helper/createDoc.md)
- [createDocs](../../../../../functions/server/test/helper/createDocs.md)
- [handleHover](../../../../../functions/server/src/features/hover/handleHover.md)