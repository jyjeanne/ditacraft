---
type: TypeScript Function
title: escapeRegex
resource: server/src/utils/textUtils.ts#L183-L185
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/batchMetadata/buildAttributeEdit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/validateFragment
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/findTargetElementName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/findTargetElementByIdOnly
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/findReplace/buildSearchPattern
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/profilingValidation/validateProfilingAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/elementExtent/findElementExtentById
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function escapeRegex(str: string): string`

# Called by

- [buildAttributeEdit](../../../../../functions/server/src/features/batchMetadata/buildAttributeEdit.md)
- [validateCrossReferences](../../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)
- [validateFragment](../../../../../functions/server/src/features/crossRefValidation/validateFragment.md)
- [findTargetElementName](../../../../../functions/server/src/features/crossRefValidation/findTargetElementName.md)
- [findTargetElementByIdOnly](../../../../../functions/server/src/features/crossRefValidation/findTargetElementByIdOnly.md)
- [buildSearchPattern](../../../../../functions/server/src/features/findReplace/buildSearchPattern.md)
- [validateProfilingAttributes](../../../../../functions/server/src/features/profilingValidation/validateProfilingAttributes.md)
- [findElementExtentById](../../../../../functions/server/src/utils/elementExtent/findElementExtentById.md)