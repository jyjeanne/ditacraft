---
type: TypeScript Module
title: visualEditorProvider
resource: src/editor/visualEditorProvider.ts#L1-L1064
generated:
  by: okf-rs/0.7.0
relationships:
  imports:
  - target: external/crypto
    resolved_by: tree-sitter
    confidence: exact
  - target: external/fs
    resolved_by: tree-sitter
    confidence: exact
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/vscode
    resolved_by: tree-sitter
    confidence: exact
  - target: external/providers-ditalinkprovider
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-cst-parse
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-cst-query
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-cst-types
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-editor-images
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-editor-links
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-editor-problems
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-editor-sourcechange
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-render-html
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-render-labels
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-editor-sync
    resolved_by: tree-sitter
    confidence: exact
  - target: external/shared-grammar-types
    resolved_by: tree-sitter
    confidence: exact
  - target: external/preview-grammaroptions
    resolved_by: tree-sitter
    confidence: exact
  - target: external/preview-pagehtml
    resolved_by: tree-sitter
    confidence: exact
  - target: external/preview-paths
    resolved_by: tree-sitter
    confidence: exact
  - target: external/preview-resolver
    resolved_by: tree-sitter
    confidence: exact
  - target: external/preview-sharedregistry
    resolved_by: tree-sitter
    confidence: exact
  - target: external/preview-workspacetext
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-configurationmanager
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-logger
    resolved_by: tree-sitter
    confidence: exact
  - target: external/messages
    resolved_by: tree-sitter
    confidence: exact
  - target: external/imagefiles
    resolved_by: tree-sitter
    confidence: exact
  - target: external/linkpicker
    resolved_by: tree-sitter
    confidence: exact
  - target: external/reusecopy
    resolved_by: tree-sitter
    confidence: exact
  - target: external/reusedcontent
    resolved_by: tree-sitter
    confidence: exact
  - target: external/preview-mapcontext
    resolved_by: tree-sitter
    confidence: exact
  - target: external/preview-mapcontexts
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [EditorDebugState](../../../interfaces/src/editor/visualEditorProvider/EditorDebugState.md)
- [VisualEditorSelectionSource](../../../interfaces/src/editor/visualEditorProvider/VisualEditorSelectionSource.md)
- [VisualEditorProvider](../../../classes/src/editor/visualEditorProvider/VisualEditorProvider.md)
- [constructor](../../../functions/src/editor/visualEditorProvider/VisualEditorProvider/constructor.md)
- [active](../../../functions/src/editor/visualEditorProvider/VisualEditorProvider/active.md)
- [sessionChanged](../../../functions/src/editor/visualEditorProvider/VisualEditorProvider/sessionChanged.md)
- [register](../../../functions/src/editor/visualEditorProvider/VisualEditorProvider/register.md)
- [resolveCustomTextEditor](../../../functions/src/editor/visualEditorProvider/VisualEditorProvider/resolveCustomTextEditor.md)
- [debugState](../../../functions/src/editor/visualEditorProvider/VisualEditorProvider/debugState.md)
- [debugMessage](../../../functions/src/editor/visualEditorProvider/VisualEditorProvider/debugMessage.md)
- [debugPost](../../../functions/src/editor/visualEditorProvider/VisualEditorProvider/debugPost.md)
- [queueDialogAnswer](../../../functions/src/editor/visualEditorProvider/VisualEditorProvider/queueDialogAnswer.md)
- [handoff](../../../functions/src/editor/visualEditorProvider/VisualEditorProvider/handoff.md)
- [takeHandoff](../../../functions/src/editor/visualEditorProvider/VisualEditorProvider/takeHandoff.md)
- [cursorOffset](../../../functions/src/editor/visualEditorProvider/VisualEditorProvider/cursorOffset.md)
- [EditorSession](../../../classes/src/editor/visualEditorProvider/EditorSession.md)
- [constructor](../../../functions/src/editor/visualEditorProvider/EditorSession/constructor.md)
- [readsFile](../../../functions/src/editor/visualEditorProvider/EditorSession/readsFile.md)
- [scheduleResolved](../../../functions/src/editor/visualEditorProvider/EditorSession/scheduleResolved.md)
- [webviewUri](../../../functions/src/editor/visualEditorProvider/EditorSession/webviewUri.md)
- [postResolved](../../../functions/src/editor/visualEditorProvider/EditorSession/postResolved.md)
- [syncOn](../../../functions/src/editor/visualEditorProvider/EditorSession/syncOn.md)
- [textEditors](../../../functions/src/editor/visualEditorProvider/EditorSession/textEditors.md)
- [followsEditor](../../../functions/src/editor/visualEditorProvider/EditorSession/followsEditor.md)
- [postSyncState](../../../functions/src/editor/visualEditorProvider/EditorSession/postSyncState.md)
- [followPage](../../../functions/src/editor/visualEditorProvider/EditorSession/followPage.md)
- [revealCursor](../../../functions/src/editor/visualEditorProvider/EditorSession/revealCursor.md)
- [cursorOffset](../../../functions/src/editor/visualEditorProvider/EditorSession/cursorOffset.md)
- [uri](../../../functions/src/editor/visualEditorProvider/EditorSession/uri.md)
- [dispose](../../../functions/src/editor/visualEditorProvider/EditorSession/dispose.md)
- [debugState](../../../functions/src/editor/visualEditorProvider/EditorSession/debugState.md)
- [resourceRoots](../../../functions/src/editor/visualEditorProvider/EditorSession/resourceRoots.md)
- [html](../../../functions/src/editor/visualEditorProvider/EditorSession/html.md)
- [customCssPath](../../../functions/src/editor/visualEditorProvider/EditorSession/customCssPath.md)
- [settings](../../../functions/src/editor/visualEditorProvider/EditorSession/settings.md)
- [post](../../../functions/src/editor/visualEditorProvider/EditorSession/post.md)
- [postToPage](../../../functions/src/editor/visualEditorProvider/EditorSession/postToPage.md)
- [grammarKeyOf](../../../functions/src/editor/visualEditorProvider/EditorSession/grammarKeyOf.md)
- [sendInit](../../../functions/src/editor/visualEditorProvider/EditorSession/sendInit.md)
- [postProblems](../../../functions/src/editor/visualEditorProvider/EditorSession/postProblems.md)
- [quickFixes](../../../functions/src/editor/visualEditorProvider/EditorSession/quickFixes.md)
- [quickFix](../../../functions/src/editor/visualEditorProvider/EditorSession/quickFix.md)
- [topicEdits](../../../functions/src/editor/visualEditorProvider/EditorSession/topicEdits.md)
- [setAttributes](../../../functions/src/editor/visualEditorProvider/EditorSession/setAttributes.md)
- [handle](../../../functions/src/editor/visualEditorProvider/EditorSession/handle.md)
- [apply](../../../functions/src/editor/visualEditorProvider/EditorSession/apply.md)
- [onDocumentChange](../../../functions/src/editor/visualEditorProvider/EditorSession/onDocumentChange.md)
- [labels](../../../functions/src/editor/visualEditorProvider/EditorSession/labels.md)
- [linkContext](../../../functions/src/editor/visualEditorProvider/EditorSession/linkContext.md)
- [isMap](../../../functions/src/editor/visualEditorProvider/EditorSession/isMap.md)
- [resolveKey](../../../functions/src/editor/visualEditorProvider/EditorSession/resolveKey.md)
- [refreshContext](../../../functions/src/editor/visualEditorProvider/EditorSession/refreshContext.md)
- [contextFromRow](../../../functions/src/editor/visualEditorProvider/EditorSession/contextFromRow.md)
- [askText](../../../functions/src/editor/visualEditorProvider/EditorSession/askText.md)
- [pickFile](../../../functions/src/editor/visualEditorProvider/EditorSession/pickFile.md)
- [images](../../../functions/src/editor/visualEditorProvider/EditorSession/images.md)
- [reuse](../../../functions/src/editor/visualEditorProvider/EditorSession/reuse.md)
- [openSource](../../../functions/src/editor/visualEditorProvider/EditorSession/openSource.md)
- [fixTitle](../../../functions/src/editor/visualEditorProvider/fixTitle.md)
- [isCommand](../../../functions/src/editor/visualEditorProvider/isCommand.md)
- [elementAt](../../../functions/src/editor/visualEditorProvider/elementAt.md)

# Imports

- `crypto`
- `fs`
- `path`
- `vscode`
- `../providers/ditaLinkProvider`
- `../shared/cst/parse`
- `../shared/cst/query`
- `../shared/cst/types`
- `../shared/editor/images`
- `../shared/editor/links`
- `../shared/editor/problems`
- `../shared/editor/sourceChange`
- `../shared/render/html`
- `../shared/render/labels`
- `../shared/editor/sync`
- `../shared/grammar/types`
- `../preview/grammarOptions`
- `../preview/pageHtml`
- `../preview/paths`
- `../preview/resolver`
- `../preview/sharedRegistry`
- `../preview/workspaceText`
- `../utils/configurationManager`
- `../utils/logger`
- `./messages`
- `./imageFiles`
- `./linkPicker`
- `./reuseCopy`
- `./reusedContent`
- `../preview/mapContext`
- `../preview/mapContexts`

# Member of

- [ditacraft](../../../packages/ditacraft.md)