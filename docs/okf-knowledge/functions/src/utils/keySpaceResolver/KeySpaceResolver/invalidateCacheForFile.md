---
type: TypeScript Method
title: invalidateCacheForFile
resource: src/utils/keySpaceResolver.ts#L331-L351
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/queueInvalidation
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private invalidateCacheForFile(changedFile: string): void`

# Calls

- [entries](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)

# Called by

- [queueInvalidation](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/queueInvalidation.md)