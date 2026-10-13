---
type: TypeScript Function
title: handleComputeInlineConrefEdit
resource: server/src/features/inlineConref.ts#L272-L373
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/uriToPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/effectiveWorkspaceFolders
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/getWorkspaceFolders
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/inlineConref/readDocOrFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/inlineConref/findConrefElementAtOffset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/inlineConref/tagAttributes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/referenceParser/getTargetId
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/elementExtent/findElementExtentById
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/inlineConref/rootElementId
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/inlineConref/rebaseReference
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/inlineConref/stripNestedIds
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/inlineConref/rebaseContentReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/elementExtent/getElementInnerContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/inlineConref/resolvedOpenTag
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/offsetToRange
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/test/inlineConref/test/inline
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function handleComputeInlineConrefEdit( params: InlineConrefParams, documents: TextDocuments<TextDocument>, keySpaceService: KeySpaceService | undefined ): Promise<InlineConrefResult>`

# Calls

- [uriToPath](../../../../../functions/server/src/utils/textUtils/uriToPath.md)
- [effectiveWorkspaceFolders](../../../../../functions/server/src/utils/textUtils/effectiveWorkspaceFolders.md)
- [getWorkspaceFolders](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/getWorkspaceFolders.md)
- [readDocOrFile](../../../../../functions/server/src/features/inlineConref/readDocOrFile.md)
- [findConrefElementAtOffset](../../../../../functions/server/src/features/inlineConref/findConrefElementAtOffset.md)
- [tagAttributes](../../../../../functions/server/src/features/inlineConref/tagAttributes.md)
- [getTargetId](../../../../../functions/server/src/utils/referenceParser/getTargetId.md)
- [findElementExtentById](../../../../../functions/server/src/utils/elementExtent/findElementExtentById.md)
- [rootElementId](../../../../../functions/server/src/features/inlineConref/rootElementId.md)
- [rebaseReference](../../../../../functions/server/src/features/inlineConref/rebaseReference.md)
- [stripNestedIds](../../../../../functions/server/src/features/inlineConref/stripNestedIds.md)
- [rebaseContentReferences](../../../../../functions/server/src/features/inlineConref/rebaseContentReferences.md)
- [getElementInnerContent](../../../../../functions/server/src/utils/elementExtent/getElementInnerContent.md)
- [resolvedOpenTag](../../../../../functions/server/src/features/inlineConref/resolvedOpenTag.md)
- [offsetToRange](../../../../../functions/server/src/utils/textUtils/offsetToRange.md)

# Called by

- [inline](../../../../../functions/server/test/inlineConref/test/inline.md)