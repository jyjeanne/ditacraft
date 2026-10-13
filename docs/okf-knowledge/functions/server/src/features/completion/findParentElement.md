---
type: TypeScript Function
title: findParentElement
resource: server/src/features/completion.ts#L137-L168
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/tagStack/resyncStackToMatch
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/completion/detectContext
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findParentElement(text: string, beforePos: number): string`

# Calls

- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [resyncStackToMatch](../../../../../functions/server/src/utils/tagStack/resyncStackToMatch.md)

# Called by

- [detectContext](../../../../../functions/server/src/features/completion/detectContext.md)