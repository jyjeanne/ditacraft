---
type: TypeScript Function
title: renameAt
resource: server/test/rename.test.ts#L751-L761
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/features/rename/handlePrepareRename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/handleRename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function renameAt(p: ReturnType<typeof project>, needle: string, delta: number, newName: string, ks?: KeySpaceService)`

# Calls

- [handlePrepareRename](../../../../../functions/server/src/features/rename/handlePrepareRename.md)
- [handleRename](../../../../../functions/server/src/features/rename/handleRename.md)
- [entries](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)
- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)