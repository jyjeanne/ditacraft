---
type: TypeScript Function
title: getAttributeCompletions
resource: server/src/features/completion.ts#L291-L310
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/completion/handleCompletion
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function getAttributeCompletions(ctx: CompletionContext): CompletionItem[]`

# Calls

- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [handleCompletion](../../../../../functions/server/src/features/completion/handleCompletion.md)