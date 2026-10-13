---
type: TypeScript Function
title: moveFiles
resource: server/test/moveTopic.test.ts#L138-L155
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/test/helper/createDocs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/moveTopic/handleComputeMoveEdits
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function moveFiles(files: Record<string, string>, moves: Record<string, string>, docs = createDocs())`

# Calls

- [createDocs](../../../../../functions/server/test/helper/createDocs.md)
- [entries](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)
- [handleComputeMoveEdits](../../../../../functions/server/src/features/moveTopic/handleComputeMoveEdits.md)