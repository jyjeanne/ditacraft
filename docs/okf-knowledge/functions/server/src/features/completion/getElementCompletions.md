---
type: TypeScript Function
title: getElementCompletions
resource: server/src/features/completion.ts#L261-L289
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/completion/handleCompletion
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function getElementCompletions( ctx: CompletionContext, startPos: Position, endPos: Position ): CompletionItem[]`

# Called by

- [handleCompletion](../../../../../functions/server/src/features/completion/handleCompletion.md)