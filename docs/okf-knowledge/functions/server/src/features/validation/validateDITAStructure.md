---
type: TypeScript Function
title: validateDITAStructure
resource: server/src/features/validation.ts#L355-L394
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/features/validation/getFileExtension
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/stripCommentsAndCodeContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateDitavalStructure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/createRange
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateTopicStructure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateMapStructure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateBookmapStructure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/checkEmptyElements
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/validation/validateDITADocument
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function validateDITAStructure( text: string, uri: string, diagnostics: Diagnostic[], settings: DitaCraftSettings ): void`

# Calls

- [getFileExtension](../../../../../functions/server/src/features/validation/getFileExtension.md)
- [stripCommentsAndCodeContent](../../../../../functions/server/src/utils/textUtils/stripCommentsAndCodeContent.md)
- [validateDitavalStructure](../../../../../functions/server/src/features/validation/validateDitavalStructure.md)
- [createRange](../../../../../functions/server/src/features/validation/createRange.md)
- [validateTopicStructure](../../../../../functions/server/src/features/validation/validateTopicStructure.md)
- [validateMapStructure](../../../../../functions/server/src/features/validation/validateMapStructure.md)
- [validateBookmapStructure](../../../../../functions/server/src/features/validation/validateBookmapStructure.md)
- [checkEmptyElements](../../../../../functions/server/src/features/validation/checkEmptyElements.md)

# Called by

- [validateDITADocument](../../../../../functions/server/src/features/validation/validateDITADocument.md)