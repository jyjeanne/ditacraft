---
type: TypeScript Function
title: parseReference
resource: server/src/utils/referenceParser.ts#L35-L44
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/mcp/src/tools/ditaResolveReference/resolveHrefOrConref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/definition/handleDefinition
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/hover/getHrefHover
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/inlineConref/handleComputeInlineConrefEdit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/moveTopic/handleComputeMoveEdits
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/referenceParser/findFileReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/referenceParser/referenceMatchesId
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/workspaceScanner/referenceMatchesTarget
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function parseReference(value: string): ParsedReference`

# Called by

- [resolveHrefOrConref](../../../../../functions/mcp/src/tools/ditaResolveReference/resolveHrefOrConref.md)
- [validateCrossReferences](../../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)
- [handleDefinition](../../../../../functions/server/src/features/definition/handleDefinition.md)
- [getHrefHover](../../../../../functions/server/src/features/hover/getHrefHover.md)
- [handleComputeInlineConrefEdit](../../../../../functions/server/src/features/inlineConref/handleComputeInlineConrefEdit.md)
- [handleComputeMoveEdits](../../../../../functions/server/src/features/moveTopic/handleComputeMoveEdits.md)
- [findFileReferences](../../../../../functions/server/src/utils/referenceParser/findFileReferences.md)
- [referenceMatchesId](../../../../../functions/server/src/utils/referenceParser/referenceMatchesId.md)
- [referenceMatchesTarget](../../../../../functions/server/src/utils/workspaceScanner/referenceMatchesTarget.md)