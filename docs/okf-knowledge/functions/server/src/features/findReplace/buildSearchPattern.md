---
type: TypeScript Function
title: buildSearchPattern
resource: server/src/features/findReplace.ts#L66-L77
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/escapeRegex
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/findReplace/handleComputeFindReplaceEdits
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function buildSearchPattern( query: string, useRegex: boolean, caseSensitive: boolean, wholeWord: boolean ): RegExp`

# Calls

- [escapeRegex](../../../../../functions/server/src/utils/textUtils/escapeRegex.md)

# Called by

- [handleComputeFindReplaceEdits](../../../../../functions/server/src/features/findReplace/handleComputeFindReplaceEdits.md)