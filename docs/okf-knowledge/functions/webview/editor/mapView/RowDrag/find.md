---
type: TypeScript Method
title: find
resource: webview/editor/mapView.ts#L595-L636
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/mapCommands/MapCommands/dropPosition
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/dropTarget
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/docs/user-guide/build/gradle/runDitaOt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/scripts/cover/render/chromePath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/scripts/screenshots/launch
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/scripts/screenshots/shoot/main
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/appendDitaOtChunkBuildWarnings
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/inlineConref/rootElementId
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/findKeyDefinition
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/chooseRootMap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/findContainingWorkspaceFolder
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/xmlTokenizer/test/firstOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/chat/ditacraftParticipant/handleValidate
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/configureAICommand/AiSettingsPanel/handle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/watchModeCommand/resolveWatchPublishOptions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkPicker/load
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkPicker/choose
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkPicker/pickLinkTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkTargets/titleOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkTargets/fileSummary
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/reuseCopy/reuseCopy
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/VisualEditorProvider/debugMessage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/VisualEditorProvider/debugPost
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/VisualEditorProvider/handoff
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/VisualEditorProvider/cursorOffset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerMoveTopicFeature
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/registerCommands
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/activeTopicUri
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/llm/llmRouterService/LLMRouterService/testProvider
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/ditaval/decideValues
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/ditaval/flagStyle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/select
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/byPublicId
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/fromExternalCatalog
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/findPlaces
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/mapTitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/navtitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/samePlace
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/loadMaps
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/chooseFromMapRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/titleOfFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/mapTitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/resolver/ReferenceResolver/titleChild
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/revealInEditor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/openFileAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/workspaceText/readWorkspaceText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/properties/propertiesView/PropertiesViewProvider/set
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/_handlePreviewScroll
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/elementIndex/ElementIndex/chainAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/elementIndex/ElementIndex/innermostContaining
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/attr
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/firstChildNamed
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/firstTextChild
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/rootElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/doctypePublicId
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/doctypeInternalSubset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/tableGrid/gridCellFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/images/withAltText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/links/LinkCommands/current
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/referenceElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/setLabel
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/mapCommands/MapCommands/pointsToTopic
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/relTables/RelTableCommands/gridAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/reused/isReuseNode
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/schema/xmlAttr
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/sourceChange/keepMarks
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/sourcePositions/SourcePositions/positionOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/sourcePositions/SourcePositions/offsetOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/attr
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/cellAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/rebuild
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/commit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/rowsOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/withRowCells
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/TableCommands/addColumn
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/tables/freshName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/opaqueView
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/openTag
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/Writer/blockMiddle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/childByToken
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editorMaps/test/rowWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/suite/visualEditor/test/editorState
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditavalParser/governingRule
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/chooseRootMap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keyUsageScanner/scanKeyUsages
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/imageResize/imageResizing
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/followMoves
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/shownProblems
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/problemHere
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/nextProblem
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/showRowTitle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/replaceImage
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/xmlValue
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/debug
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/isFolded
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/setFold
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/setAllFolds
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/foldPaths
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/reusedView/ReusedView/render
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private find(x: number, y: number): void`

# Calls

- [dropPosition](../../../../../functions/src/shared/editor/mapCommands/MapCommands/dropPosition.md)
- [dropTarget](../../../../../functions/webview/editor/mapView/dropTarget.md)

# Called by

- [runDitaOt](../../../../../functions/docs/user-guide/build/gradle/runDitaOt.md)
- [chromePath](../../../../../functions/scripts/cover/render/chromePath.md)
- [launch](../../../../../functions/scripts/screenshots/launch.md)
- [main](../../../../../functions/scripts/screenshots/shoot/main.md)
- [appendDitaOtChunkBuildWarnings](../../../../../functions/server/src/features/crossRefValidation/appendDitaOtChunkBuildWarnings.md)
- [rootElementId](../../../../../functions/server/src/features/inlineConref/rootElementId.md)
- [findKeyDefinition](../../../../../functions/server/src/features/rename/findKeyDefinition.md)
- [chooseRootMap](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/chooseRootMap.md)
- [findContainingWorkspaceFolder](../../../../../functions/server/src/utils/textUtils/findContainingWorkspaceFolder.md)
- [firstOf](../../../../../functions/server/test/xmlTokenizer/test/firstOf.md)
- [handleValidate](../../../../../functions/src/chat/ditacraftParticipant/handleValidate.md)
- [handle](../../../../../functions/src/commands/configureAICommand/AiSettingsPanel/handle.md)
- [resolveWatchPublishOptions](../../../../../functions/src/commands/watchModeCommand/resolveWatchPublishOptions.md)
- [load](../../../../../functions/src/editor/linkPicker/load.md)
- [choose](../../../../../functions/src/editor/linkPicker/choose.md)
- [pickLinkTarget](../../../../../functions/src/editor/linkPicker/pickLinkTarget.md)
- [titleOf](../../../../../functions/src/editor/linkTargets/titleOf.md)
- [fileSummary](../../../../../functions/src/editor/linkTargets/fileSummary.md)
- [reuseCopy](../../../../../functions/src/editor/reuseCopy/reuseCopy.md)
- [debugMessage](../../../../../functions/src/editor/visualEditorProvider/VisualEditorProvider/debugMessage.md)
- [debugPost](../../../../../functions/src/editor/visualEditorProvider/VisualEditorProvider/debugPost.md)
- [handoff](../../../../../functions/src/editor/visualEditorProvider/VisualEditorProvider/handoff.md)
- [cursorOffset](../../../../../functions/src/editor/visualEditorProvider/VisualEditorProvider/cursorOffset.md)
- [registerMoveTopicFeature](../../../../../functions/src/extension/registerMoveTopicFeature.md)
- [registerCommands](../../../../../functions/src/extension/registerCommands.md)
- [activeTopicUri](../../../../../functions/src/extension/activeTopicUri.md)
- [testProvider](../../../../../functions/src/llm/llmRouterService/LLMRouterService/testProvider.md)
- [decideValues](../../../../../functions/src/preview/ditaval/decideValues.md)
- [flagStyle](../../../../../functions/src/preview/ditaval/flagStyle.md)
- [select](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/select.md)
- [byPublicId](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/byPublicId.md)
- [fromExternalCatalog](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/fromExternalCatalog.md)
- [findPlaces](../../../../../functions/src/preview/mapContext/findPlaces.md)
- [mapTitle](../../../../../functions/src/preview/mapContext/mapTitle.md)
- [navtitle](../../../../../functions/src/preview/mapContext/navtitle.md)
- [samePlace](../../../../../functions/src/preview/mapContext/samePlace.md)
- [loadMaps](../../../../../functions/src/preview/mapContexts/MapContexts/loadMaps.md)
- [chooseFromMapRow](../../../../../functions/src/preview/mapContexts/MapContexts/chooseFromMapRow.md)
- [titleOfFile](../../../../../functions/src/preview/resolver/ReferenceResolver/titleOfFile.md)
- [mapTitle](../../../../../functions/src/preview/resolver/ReferenceResolver/mapTitle.md)
- [titleChild](../../../../../functions/src/preview/resolver/ReferenceResolver/titleChild.md)
- [revealInEditor](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/revealInEditor.md)
- [openFileAt](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/openFileAt.md)
- [readWorkspaceText](../../../../../functions/src/preview/workspaceText/readWorkspaceText.md)
- [set](../../../../../functions/src/properties/propertiesView/PropertiesViewProvider/set.md)
- [_handlePreviewScroll](../../../../../functions/src/providers/previewPanel/DitaPreviewPanel/_handlePreviewScroll.md)
- [chainAt](../../../../../functions/src/shared/cst/elementIndex/ElementIndex/chainAt.md)
- [innermostContaining](../../../../../functions/src/shared/cst/elementIndex/ElementIndex/innermostContaining.md)
- [attr](../../../../../functions/src/shared/cst/query/attr.md)
- [firstChildNamed](../../../../../functions/src/shared/cst/query/firstChildNamed.md)
- [firstTextChild](../../../../../functions/src/shared/cst/query/firstTextChild.md)
- [rootElement](../../../../../functions/src/shared/cst/query/rootElement.md)
- [doctypePublicId](../../../../../functions/src/shared/cst/query/doctypePublicId.md)
- [doctypeInternalSubset](../../../../../functions/src/shared/cst/query/doctypeInternalSubset.md)
- [gridCellFor](../../../../../functions/src/shared/cst/tableGrid/gridCellFor.md)
- [withAltText](../../../../../functions/src/shared/editor/images/withAltText.md)
- [current](../../../../../functions/src/shared/editor/links/LinkCommands/current.md)
- [referenceElement](../../../../../functions/src/shared/editor/mapCommands/MapCommands/referenceElement.md)
- [setLabel](../../../../../functions/src/shared/editor/mapCommands/MapCommands/setLabel.md)
- [pointsToTopic](../../../../../functions/src/shared/editor/mapCommands/MapCommands/pointsToTopic.md)
- [get](../../../../../functions/src/shared/editor/maps/get.md)
- [gridAt](../../../../../functions/src/shared/editor/relTables/RelTableCommands/gridAt.md)
- [isReuseNode](../../../../../functions/src/shared/editor/reused/isReuseNode.md)
- [xmlAttr](../../../../../functions/src/shared/editor/schema/xmlAttr.md)
- [keepMarks](../../../../../functions/src/shared/editor/sourceChange/keepMarks.md)
- [positionOf](../../../../../functions/src/shared/editor/sourcePositions/SourcePositions/positionOf.md)
- [offsetOf](../../../../../functions/src/shared/editor/sourcePositions/SourcePositions/offsetOf.md)
- [attr](../../../../../functions/src/shared/editor/tables/TableCommands/attr.md)
- [cellAt](../../../../../functions/src/shared/editor/tables/TableCommands/cellAt.md)
- [rebuild](../../../../../functions/src/shared/editor/tables/TableCommands/rebuild.md)
- [commit](../../../../../functions/src/shared/editor/tables/TableCommands/commit.md)
- [rowsOf](../../../../../functions/src/shared/editor/tables/TableCommands/rowsOf.md)
- [withRowCells](../../../../../functions/src/shared/editor/tables/TableCommands/withRowCells.md)
- [addColumn](../../../../../functions/src/shared/editor/tables/TableCommands/addColumn.md)
- [freshName](../../../../../functions/src/shared/editor/tables/freshName.md)
- [opaqueView](../../../../../functions/src/shared/editor/toProseMirror/Builder/opaqueView.md)
- [openTag](../../../../../functions/src/shared/editor/toSource/Writer/openTag.md)
- [blockMiddle](../../../../../functions/src/shared/editor/toSource/Writer/blockMiddle.md)
- [childByToken](../../../../../functions/src/shared/render/toHtml/Renderer/childByToken.md)
- [rowWith](../../../../../functions/src/test/shared/editorMaps/test/rowWith.md)
- [editorState](../../../../../functions/src/test/suite/visualEditor/test/editorState.md)
- [governingRule](../../../../../functions/src/utils/ditavalParser/governingRule.md)
- [chooseRootMap](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/chooseRootMap.md)
- [scanKeyUsages](../../../../../functions/src/utils/keyUsageScanner/scanKeyUsages.md)
- [imageResizing](../../../../../functions/webview/editor/imageResize/imageResizing.md)
- [followMoves](../../../../../functions/webview/editor/followMoves.md)
- [shownProblems](../../../../../functions/webview/editor/shownProblems.md)
- [problemHere](../../../../../functions/webview/editor/problemHere.md)
- [nextProblem](../../../../../functions/webview/editor/nextProblem.md)
- [showRowTitle](../../../../../functions/webview/editor/showRowTitle.md)
- [replaceImage](../../../../../functions/webview/editor/replaceImage.md)
- [xmlValue](../../../../../functions/webview/editor/xmlValue.md)
- [debug](../../../../../functions/webview/editor/debug.md)
- [isFolded](../../../../../functions/webview/editor/mapView/isFolded.md)
- [setFold](../../../../../functions/webview/editor/mapView/setFold.md)
- [setAllFolds](../../../../../functions/webview/editor/mapView/setAllFolds.md)
- [foldPaths](../../../../../functions/webview/editor/mapView/foldPaths.md)
- [render](../../../../../functions/webview/editor/reusedView/ReusedView/render.md)