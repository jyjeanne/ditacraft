---
type: TypeScript Function
title: offsetToRange
resource: server/src/utils/textUtils.ts#L42-L73
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/batchMetadata/buildAttributeEdit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/circularRefDetection/resolveRef
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/customRulesValidator/validateCustomRules
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/ditaRulesValidator/makeDiag
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/findReplace/handleComputeFindReplaceEdits
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/inlineConref/handleComputeInlineConrefEdit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/profilingValidation/validateProfilingAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateTopicStructure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/workspaceValidation/detectCrossFileDuplicateIds
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function offsetToRange(text: string, start: number, end: number): Range`

# Called by

- [buildAttributeEdit](../../../../../functions/server/src/features/batchMetadata/buildAttributeEdit.md)
- [resolveRef](../../../../../functions/server/src/features/circularRefDetection/resolveRef.md)
- [validateCrossReferences](../../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)
- [validateCustomRules](../../../../../functions/server/src/features/customRulesValidator/validateCustomRules.md)
- [makeDiag](../../../../../functions/server/src/features/ditaRulesValidator/makeDiag.md)
- [handleComputeFindReplaceEdits](../../../../../functions/server/src/features/findReplace/handleComputeFindReplaceEdits.md)
- [handleComputeInlineConrefEdit](../../../../../functions/server/src/features/inlineConref/handleComputeInlineConrefEdit.md)
- [validateProfilingAttributes](../../../../../functions/server/src/features/profilingValidation/validateProfilingAttributes.md)
- [validateTopicStructure](../../../../../functions/server/src/features/validation/validateTopicStructure.md)
- [detectCrossFileDuplicateIds](../../../../../functions/server/src/features/workspaceValidation/detectCrossFileDuplicateIds.md)