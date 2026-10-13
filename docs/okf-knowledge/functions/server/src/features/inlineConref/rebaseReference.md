---
type: TypeScript Function
title: rebaseReference
resource: server/src/features/inlineConref.ts#L180-L212
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/normalizeFsPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/reuseCopy/uriPath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/inlineConref/resolvedOpenTag
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/inlineConref/handleComputeInlineConrefEdit
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function rebaseReference(value: string, from: string, to: string, fromTopicId: string | undefined): string`

# Calls

- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [normalizeFsPath](../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)
- [uriPath](../../../../../functions/src/editor/reuseCopy/uriPath.md)

# Called by

- [resolvedOpenTag](../../../../../functions/server/src/features/inlineConref/resolvedOpenTag.md)
- [handleComputeInlineConrefEdit](../../../../../functions/server/src/features/inlineConref/handleComputeInlineConrefEdit.md)