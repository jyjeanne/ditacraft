---
type: TypeScript Function
title: tagAttributes
resource: server/src/features/inlineConref.ts#L134-L148
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/server/src/features/inlineConref/resolvedOpenTag
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/inlineConref/rebaseContentReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/inlineConref/handleComputeInlineConrefEdit
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function tagAttributes(openTag: string): TagAttribute[]`

# Called by

- [resolvedOpenTag](../../../../../functions/server/src/features/inlineConref/resolvedOpenTag.md)
- [rebaseContentReferences](../../../../../functions/server/src/features/inlineConref/rebaseContentReferences.md)
- [handleComputeInlineConrefEdit](../../../../../functions/server/src/features/inlineConref/handleComputeInlineConrefEdit.md)