---
type: TypeScript Module
title: editor
resource: webview/editor/main.ts#L1-L2268
generated:
  by: okf-rs/0.7.0
relationships:
  imports:
  - target: external/prosemirror-commands
    resolved_by: tree-sitter
    confidence: exact
  - target: external/prosemirror-dropcursor
    resolved_by: tree-sitter
    confidence: exact
  - target: external/prosemirror-gapcursor
    resolved_by: tree-sitter
    confidence: exact
  - target: external/prosemirror-history
    resolved_by: tree-sitter
    confidence: exact
  - target: external/prosemirror-keymap
    resolved_by: tree-sitter
    confidence: exact
  - target: external/prosemirror-model
    resolved_by: tree-sitter
    confidence: exact
  - target: external/prosemirror-state
    resolved_by: tree-sitter
    confidence: exact
  - target: external/prosemirror-view
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-editor-messages
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-cst-parse
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-cst-query
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-cst-types
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-editor-commands
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-editor-contextmenu
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-editor-images
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-editor-links
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-editor-mapcommands
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-editor-reltables
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-editor-maps
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-editor-problems
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-editor-schema
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-editor-sourcechange
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-editor-sourcepositions
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-editor-tables
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-editor-sync
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-editor-toprosemirror
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-editor-tosource
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-grammar-types
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-render-html
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-render-labels
    resolved_by: tree-sitter
    confidence: exact
  - target: external/src-shared-editor-reused
    resolved_by: tree-sitter
    confidence: exact
  - target: external/columnresize
    resolved_by: tree-sitter
    confidence: exact
  - target: external/reusedview
    resolved_by: tree-sitter
    confidence: exact
  - target: external/imageresize
    resolved_by: tree-sitter
    confidence: exact
  - target: external/mapview
    resolved_by: tree-sitter
    confidence: exact
  - target: external/menu
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [VsCodeApi](../../interfaces/webview/editor/VsCodeApi.md)
- [post](../../functions/webview/editor/post.md)
- [Session](../../interfaces/webview/editor/Session.md)
- [build](../../functions/webview/editor/build.md)
- [plugins](../../functions/webview/editor/plugins.md)
- [problemsPlugin](../../functions/webview/editor/problemsPlugin.md)
- [freshBuild](../../functions/webview/editor/freshBuild.md)
- [resolvedPlugin](../../functions/webview/editor/resolvedPlugin.md)
- [followMoves](../../functions/webview/editor/followMoves.md)
- [showResolved](../../functions/webview/editor/showResolved.md)
- [problemText](../../functions/webview/editor/problemText.md)
- [showProblems](../../functions/webview/editor/showProblems.md)
- [shownProblems](../../functions/webview/editor/shownProblems.md)
- [scheduleSyncReport](../../functions/webview/editor/scheduleSyncReport.md)
- [reportSync](../../functions/webview/editor/reportSync.md)
- [topVisiblePosition](../../functions/webview/editor/topVisiblePosition.md)
- [scrollToPosition](../../functions/webview/editor/scrollToPosition.md)
- [reveal](../../functions/webview/editor/reveal.md)
- [problemHere](../../functions/webview/editor/problemHere.md)
- [nextProblem](../../functions/webview/editor/nextProblem.md)
- [editable](../../functions/webview/editor/editable.md)
- [start](../../functions/webview/editor/start.md)
- [pauseMessage](../../functions/webview/editor/pauseMessage.md)
- [rebuild](../../functions/webview/editor/rebuild.md)
- [dispatchTransaction](../../functions/webview/editor/dispatchTransaction.md)
- [scheduleSelectionReport](../../functions/webview/editor/scheduleSelectionReport.md)
- [selectionChain](../../functions/webview/editor/selectionChain.md)
- [reportSelection](../../functions/webview/editor/reportSelection.md)
- [setAttributes](../../functions/webview/editor/setAttributes.md)
- [scheduleSync](../../functions/webview/editor/scheduleSync.md)
- [flush](../../functions/webview/editor/flush.md)
- [cursorOffset](../../functions/webview/editor/cursorOffset.md)
- [decorate](../../functions/webview/editor/decorate.md)
- [clipboardSerializer](../../functions/webview/editor/clipboardSerializer.md)
- [rawOf](../../functions/webview/editor/rawOf.md)
- [json](../../functions/webview/editor/json.md)
- [clipboardParser](../../functions/webview/editor/clipboardParser.md)
- [t](../../functions/webview/editor/t.md)
- [button](../../functions/webview/editor/button.md)
- [run](../../functions/webview/editor/run.md)
- [markButton](../../functions/webview/editor/markButton.md)
- [renderToolbar](../../functions/webview/editor/renderToolbar.md)
- [renderMapToolbar](../../functions/webview/editor/renderMapToolbar.md)
- [toggleMarkup](../../functions/webview/editor/toggleMarkup.md)
- [listToggle](../../functions/webview/editor/listToggle.md)
- [styleSelect](../../functions/webview/editor/styleSelect.md)
- [currentElement](../../functions/webview/editor/currentElement.md)
- [menuContext](../../functions/webview/editor/menuContext.md)
- [runMenuItem](../../functions/webview/editor/runMenuItem.md)
- [rowContext](../../functions/webview/editor/rowContext.md)
- [openRowTarget](../../functions/webview/editor/openRowTarget.md)
- [showRowTitle](../../functions/webview/editor/showRowTitle.md)
- [pickRowTarget](../../functions/webview/editor/pickRowTarget.md)
- [addReference](../../functions/webview/editor/addReference.md)
- [fixMapSelection](../../functions/webview/editor/fixMapSelection.md)
- [noteStatus](../../functions/webview/editor/noteStatus.md)
- [cursorPlace](../../functions/webview/editor/cursorPlace.md)
- [listQuickFixes](../../functions/webview/editor/listQuickFixes.md)
- [showQuickFixes](../../functions/webview/editor/showQuickFixes.md)
- [makeQuickFix](../../functions/webview/editor/makeQuickFix.md)
- [pickAndSetLink](../../functions/webview/editor/pickAndSetLink.md)
- [askHost](../../functions/webview/editor/askHost.md)
- [hostReply](../../functions/webview/editor/hostReply.md)
- [insertImages](../../functions/webview/editor/insertImages.md)
- [pickAndInsertImage](../../functions/webview/editor/pickAndInsertImage.md)
- [replaceImage](../../functions/webview/editor/replaceImage.md)
- [editAltText](../../functions/webview/editor/editAltText.md)
- [insertImageData](../../functions/webview/editor/insertImageData.md)
- [readFile](../../functions/webview/editor/readFile.md)
- [pasteImages](../../functions/webview/editor/pasteImages.md)
- [dropImages](../../functions/webview/editor/dropImages.md)
- [toggleToolbarMenu](../../functions/webview/editor/toggleToolbarMenu.md)
- [refocusAfterMenu](../../functions/webview/editor/refocusAfterMenu.md)
- [showContextMenu](../../functions/webview/editor/showContextMenu.md)
- [pasteFromClipboard](../../functions/webview/editor/pasteFromClipboard.md)
- [pasteText](../../functions/webview/editor/pasteText.md)
- [xmlValue](../../functions/webview/editor/xmlValue.md)
- [reuseNodes](../../functions/webview/editor/reuseNodes.md)
- [selectedReuse](../../functions/webview/editor/selectedReuse.md)
- [updateReuseBar](../../functions/webview/editor/updateReuseBar.md)
- [placeReuseBar](../../functions/webview/editor/placeReuseBar.md)
- [noteReuse](../../functions/webview/editor/noteReuse.md)
- [reuseAction](../../functions/webview/editor/reuseAction.md)
- [sendReuse](../../functions/webview/editor/sendReuse.md)
- [reuseOffset](../../functions/webview/editor/reuseOffset.md)
- [reuseResult](../../functions/webview/editor/reuseResult.md)
- [replaceWithCopy](../../functions/webview/editor/replaceWithCopy.md)
- [scheduleUi](../../functions/webview/editor/scheduleUi.md)
- [updateUi](../../functions/webview/editor/updateUi.md)
- [markActive](../../functions/webview/editor/markActive.md)
- [updateStatus](../../functions/webview/editor/updateStatus.md)
- [showBanner](../../functions/webview/editor/showBanner.md)
- [applySettings](../../functions/webview/editor/applySettings.md)
- [debug](../../functions/webview/editor/debug.md)

# Imports

- `prosemirror-commands`
- `prosemirror-dropcursor`
- `prosemirror-gapcursor`
- `prosemirror-history`
- `prosemirror-keymap`
- `prosemirror-model`
- `prosemirror-state`
- `prosemirror-view`
- `../../src/editor/messages`
- `../../src/shared/cst/parse`
- `../../src/shared/cst/query`
- `../../src/shared/cst/types`
- `../../src/shared/editor/commands`
- `../../src/shared/editor/contextMenu`
- `../../src/shared/editor/images`
- `../../src/shared/editor/links`
- `../../src/shared/editor/mapCommands`
- `../../src/shared/editor/relTables`
- `../../src/shared/editor/maps`
- `../../src/shared/editor/problems`
- `../../src/shared/editor/schema`
- `../../src/shared/editor/sourceChange`
- `../../src/shared/editor/sourcePositions`
- `../../src/shared/editor/tables`
- `../../src/shared/editor/sync`
- `../../src/shared/editor/toProseMirror`
- `../../src/shared/editor/toSource`
- `../../src/shared/grammar/types`
- `../../src/shared/render/html`
- `../../src/shared/render/labels`
- `../../src/shared/editor/reused`
- `./columnResize`
- `./reusedView`
- `./imageResize`
- `./mapView`
- `./menu`

# Member of

- [ditacraft](../../packages/ditacraft.md)