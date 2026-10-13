---
type: TypeScript Function
title: project
resource: server/test/rename.test.ts#L742-L749
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/helper/createDoc
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/helper/createDocs
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function project(files: Record<string, string>, openRel: string)`

# Calls

- [entries](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)
- [createDoc](../../../../../functions/server/test/helper/createDoc.md)
- [createDocs](../../../../../functions/server/test/helper/createDocs.md)