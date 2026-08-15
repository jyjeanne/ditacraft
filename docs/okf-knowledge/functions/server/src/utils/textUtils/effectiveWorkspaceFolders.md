---
type: TypeScript Function
title: effectiveWorkspaceFolders
resource: server/src/utils/textUtils.ts#L170-L178
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/completion/getAttributeValueCompletions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextGraph/handleGetContextGraph
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/definition/handleDefinition
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/documentLinks/handleDocumentLinks
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/hover/handleHover
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/inlineConref/handleComputeInlineConrefEdit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function effectiveWorkspaceFolders( documentPath: string, workspaceFolders: readonly string[] ): readonly string[]`

# Called by

- [getAttributeValueCompletions](../../../../../functions/server/src/features/completion/getAttributeValueCompletions.md)
- [handleGetContextGraph](../../../../../functions/server/src/features/contextGraph/handleGetContextGraph.md)
- [validateCrossReferences](../../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)
- [handleDefinition](../../../../../functions/server/src/features/definition/handleDefinition.md)
- [handleDocumentLinks](../../../../../functions/server/src/features/documentLinks/handleDocumentLinks.md)
- [handleHover](../../../../../functions/server/src/features/hover/handleHover.md)
- [handleComputeInlineConrefEdit](../../../../../functions/server/src/features/inlineConref/handleComputeInlineConrefEdit.md)
- [runPipeline](../../../../../functions/server/src/services/validationPipeline/ValidationPipeline/runPipeline.md)