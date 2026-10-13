---
type: TypeScript Method
title: match
resource: mcp/src/resources/query.ts#L21-L30
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/mcp/src/resources/maps/readMapsResource
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/tools/ditaResolveReference/extractTitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/scripts/parity/compare-results/toDitaOtIssues
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/codeActions/fixMissingDoctype
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/codeActions/fixMissingId
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/codeActions/fixMissingTitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/codeActions/fixEmptyElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/codeActions/fixDuplicateId
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/codeActions/fixMissingOtherrole
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/codeActions/fixDeprecatedIndextermref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/codeActions/fixDeprecatedAltAttr
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/codeActions/fixMissingAlt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/codeActions/fixInvalidIdFormat
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/codeActions/fixMissingBooktitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/codeActions/fixMissingMainbooktitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/completion/findAttributeContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/completion/findCurrentElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextGraph/readTitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextGraph/readShortDesc
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextGraph/countElements
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextGraph/resolveHref
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextGraph/buildMapNode
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/getScopeValue
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/getAttributeValue
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/getContainingElementName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/findTargetElementName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/findTargetElementByIdOnly
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/customRulesValidator/detectFileType
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/formatting/detectEOL
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/hover/isInsideTag
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/inlineConref/rootElementId
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/linkedEditing/findTagAtOffset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/symbols/parseTags
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateXML
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateTopicStructure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateDitavalStructure
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/collectScopedIds
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/workspaceValidation/extractRootId
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/catalogValidationService/CatalogValidationService/errorToDiagnostic
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitionsRegex
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/extractKeyMetadata
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/extractMapReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/extractInlineScopeBlocks
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/extractRootKeyscope
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/rngValidationService/RngValidationService/resolveSchemaPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/codeActions/test/altAttrDiag
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/aiServiceOrchestrator/extractXml
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/conditionMarks/attrValue
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/extractScope
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/extractFormat
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/extractLinktext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/extractType
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/DitaLinkProvider/extractRev
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_injectPreviewEnhancementsAsync
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtErrorParser/parseErrorLine
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/parseTranstypes
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/verifyInstallation
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/parseProgress
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/editorInsertUtils/insertAtCursor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/extractKeyDefinitions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/extractInlineContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/extractMapReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/extractRootKeyscope
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/extractInlineScopeBlocks
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/mapHierarchyParser/extractAttribute
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`override match(uri: string): Variables | null`

# Called by

- [readMapsResource](../../../../../../functions/mcp/src/resources/maps/readMapsResource.md)
- [extractTitle](../../../../../../functions/mcp/src/tools/ditaResolveReference/extractTitle.md)
- [toDitaOtIssues](../../../../../../functions/scripts/parity/compare-results/toDitaOtIssues.md)
- [fixMissingDoctype](../../../../../../functions/server/src/features/codeActions/fixMissingDoctype.md)
- [fixMissingId](../../../../../../functions/server/src/features/codeActions/fixMissingId.md)
- [fixMissingTitle](../../../../../../functions/server/src/features/codeActions/fixMissingTitle.md)
- [fixEmptyElement](../../../../../../functions/server/src/features/codeActions/fixEmptyElement.md)
- [fixDuplicateId](../../../../../../functions/server/src/features/codeActions/fixDuplicateId.md)
- [fixMissingOtherrole](../../../../../../functions/server/src/features/codeActions/fixMissingOtherrole.md)
- [fixDeprecatedIndextermref](../../../../../../functions/server/src/features/codeActions/fixDeprecatedIndextermref.md)
- [fixDeprecatedAltAttr](../../../../../../functions/server/src/features/codeActions/fixDeprecatedAltAttr.md)
- [fixMissingAlt](../../../../../../functions/server/src/features/codeActions/fixMissingAlt.md)
- [fixInvalidIdFormat](../../../../../../functions/server/src/features/codeActions/fixInvalidIdFormat.md)
- [fixMissingBooktitle](../../../../../../functions/server/src/features/codeActions/fixMissingBooktitle.md)
- [fixMissingMainbooktitle](../../../../../../functions/server/src/features/codeActions/fixMissingMainbooktitle.md)
- [findAttributeContext](../../../../../../functions/server/src/features/completion/findAttributeContext.md)
- [findCurrentElement](../../../../../../functions/server/src/features/completion/findCurrentElement.md)
- [readTitle](../../../../../../functions/server/src/features/contextGraph/readTitle.md)
- [readShortDesc](../../../../../../functions/server/src/features/contextGraph/readShortDesc.md)
- [countElements](../../../../../../functions/server/src/features/contextGraph/countElements.md)
- [resolveHref](../../../../../../functions/server/src/features/contextGraph/resolveHref.md)
- [buildMapNode](../../../../../../functions/server/src/features/contextGraph/buildMapNode.md)
- [validateCrossReferences](../../../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)
- [getScopeValue](../../../../../../functions/server/src/features/crossRefValidation/getScopeValue.md)
- [getAttributeValue](../../../../../../functions/server/src/features/crossRefValidation/getAttributeValue.md)
- [getContainingElementName](../../../../../../functions/server/src/features/crossRefValidation/getContainingElementName.md)
- [findTargetElementName](../../../../../../functions/server/src/features/crossRefValidation/findTargetElementName.md)
- [findTargetElementByIdOnly](../../../../../../functions/server/src/features/crossRefValidation/findTargetElementByIdOnly.md)
- [detectFileType](../../../../../../functions/server/src/features/customRulesValidator/detectFileType.md)
- [detectEOL](../../../../../../functions/server/src/features/formatting/detectEOL.md)
- [isInsideTag](../../../../../../functions/server/src/features/hover/isInsideTag.md)
- [rootElementId](../../../../../../functions/server/src/features/inlineConref/rootElementId.md)
- [findTagAtOffset](../../../../../../functions/server/src/features/linkedEditing/findTagAtOffset.md)
- [parseTags](../../../../../../functions/server/src/features/symbols/parseTags.md)
- [validateXML](../../../../../../functions/server/src/features/validation/validateXML.md)
- [validateTopicStructure](../../../../../../functions/server/src/features/validation/validateTopicStructure.md)
- [validateDitavalStructure](../../../../../../functions/server/src/features/validation/validateDitavalStructure.md)
- [collectScopedIds](../../../../../../functions/server/src/features/validation/collectScopedIds.md)
- [extractRootId](../../../../../../functions/server/src/features/workspaceValidation/extractRootId.md)
- [errorToDiagnostic](../../../../../../functions/server/src/services/catalogValidationService/CatalogValidationService/errorToDiagnostic.md)
- [extractKeyDefinitionsRegex](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractKeyDefinitionsRegex.md)
- [extractKeyMetadata](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractKeyMetadata.md)
- [extractMapReferences](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractMapReferences.md)
- [extractInlineScopeBlocks](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractInlineScopeBlocks.md)
- [extractRootKeyscope](../../../../../../functions/server/src/services/keySpaceService/KeySpaceService/extractRootKeyscope.md)
- [resolveSchemaPath](../../../../../../functions/server/src/services/rngValidationService/RngValidationService/resolveSchemaPath.md)
- [altAttrDiag](../../../../../../functions/server/test/codeActions/test/altAttrDiag.md)
- [extractXml](../../../../../../functions/src/llm/aiServiceOrchestrator/extractXml.md)
- [attrValue](../../../../../../functions/src/preview/conditionMarks/attrValue.md)
- [extractScope](../../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/extractScope.md)
- [extractFormat](../../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/extractFormat.md)
- [extractLinktext](../../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/extractLinktext.md)
- [extractType](../../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/extractType.md)
- [extractRev](../../../../../../functions/src/providers/ditaLinkProvider/DitaLinkProvider/extractRev.md)
- [_injectPreviewEnhancementsAsync](../../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_injectPreviewEnhancementsAsync.md)
- [parseErrorLine](../../../../../../functions/src/utils/ditaOtErrorParser/parseErrorLine.md)
- [parseTranstypes](../../../../../../functions/src/utils/ditaOtWrapper/parseTranstypes.md)
- [verifyInstallation](../../../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/verifyInstallation.md)
- [parseProgress](../../../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/parseProgress.md)
- [insertAtCursor](../../../../../../functions/src/utils/editorInsertUtils/insertAtCursor.md)
- [extractKeyDefinitions](../../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/extractKeyDefinitions.md)
- [extractInlineContent](../../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/extractInlineContent.md)
- [extractMapReferences](../../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/extractMapReferences.md)
- [extractRootKeyscope](../../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/extractRootKeyscope.md)
- [extractInlineScopeBlocks](../../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/extractInlineScopeBlocks.md)
- [extractAttribute](../../../../../../functions/src/utils/mapHierarchyParser/extractAttribute.md)