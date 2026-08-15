---
type: TypeScript Function
title: getTargetId
resource: server/src/utils/referenceParser.ts#L50-L54
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/definition/handleDefinition
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/hover/getConrefPreview
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/inlineConref/handleComputeInlineConrefEdit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/referenceParser/referenceMatchesId
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function getTargetId(fragment: string): string`

# Called by

- [handleDefinition](../../../../../functions/server/src/features/definition/handleDefinition.md)
- [getConrefPreview](../../../../../functions/server/src/features/hover/getConrefPreview.md)
- [handleComputeInlineConrefEdit](../../../../../functions/server/src/features/inlineConref/handleComputeInlineConrefEdit.md)
- [referenceMatchesId](../../../../../functions/server/src/utils/referenceParser/referenceMatchesId.md)