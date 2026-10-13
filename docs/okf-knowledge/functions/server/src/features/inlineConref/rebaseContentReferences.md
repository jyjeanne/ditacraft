---
type: TypeScript Function
title: rebaseContentReferences
resource: server/src/features/inlineConref.ts#L220-L241
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/features/inlineConref/tagAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/reuseCopy/rebase
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/inlineConref/handleComputeInlineConrefEdit
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function rebaseContentReferences(content: string, rebase: (value: string) => string): string`

# Calls

- [tagAttributes](../../../../../functions/server/src/features/inlineConref/tagAttributes.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [rebase](../../../../../functions/src/editor/reuseCopy/rebase.md)

# Called by

- [handleComputeInlineConrefEdit](../../../../../functions/server/src/features/inlineConref/handleComputeInlineConrefEdit.md)