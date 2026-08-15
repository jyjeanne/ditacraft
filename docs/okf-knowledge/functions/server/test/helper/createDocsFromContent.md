---
type: TypeScript Function
title: createDocsFromContent
resource: server/test/helper.ts#L36-L43
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
  called_by:
  - target: functions/server/test/formatting/test/rangeFormat
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function createDocsFromContent( content: string, uri: string = TEST_URI ): { documents: TextDocuments<TextDocument>; document: TextDocument }`

# Calls

- [createDoc](../../../../functions/server/test/helper/createDoc.md)
- [createDocs](../../../../functions/server/test/helper/createDocs.md)

# Called by

- [rangeFormat](../../../../functions/server/test/formatting/test/rangeFormat.md)