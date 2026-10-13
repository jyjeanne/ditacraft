---
type: TypeScript Function
title: resolvedOpenTag
resource: server/src/features/inlineConref.ts#L158-L172
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
  - target: functions/server/src/features/inlineConref/rebaseReference
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/inlineConref/handleComputeInlineConrefEdit
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function resolvedOpenTag(referencingTag: string, targetTag: string, rebaseReference: (value: string) => string): string`

# Calls

- [tagAttributes](../../../../../functions/server/src/features/inlineConref/tagAttributes.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [rebaseReference](../../../../../functions/server/src/features/inlineConref/rebaseReference.md)

# Called by

- [handleComputeInlineConrefEdit](../../../../../functions/server/src/features/inlineConref/handleComputeInlineConrefEdit.md)