---
type: TypeScript Function
title: handleComputeInlineConrefEdit
resource: server/src/features/inlineConref.ts#L139-L230
generated:
  by: okf-rs/0.4.0
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
  - target: functions/server/src/utils/referenceParser/parseReference
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/referenceParser/getTargetId
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/elementExtent/findElementExtentById
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/inlineConref/stripNestedIds
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/elementExtent/getElementInnerContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/inlineConref/buildOpenTagWithoutRefAttr
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/offsetToRange
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
- [parseReference](../../../../../functions/server/src/utils/referenceParser/parseReference.md)
- [getTargetId](../../../../../functions/server/src/utils/referenceParser/getTargetId.md)
- [findElementExtentById](../../../../../functions/server/src/utils/elementExtent/findElementExtentById.md)
- [stripNestedIds](../../../../../functions/server/src/features/inlineConref/stripNestedIds.md)
- [getElementInnerContent](../../../../../functions/server/src/utils/elementExtent/getElementInnerContent.md)
- [buildOpenTagWithoutRefAttr](../../../../../functions/server/src/features/inlineConref/buildOpenTagWithoutRefAttr.md)
- [offsetToRange](../../../../../functions/server/src/utils/textUtils/offsetToRange.md)