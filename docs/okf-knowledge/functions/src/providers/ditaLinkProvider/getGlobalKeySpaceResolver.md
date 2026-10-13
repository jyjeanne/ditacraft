---
type: TypeScript Function
title: getGlobalKeySpaceResolver
resource: src/providers/ditaLinkProvider.ts#L900-L905
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/editor/linkPicker/keyTargets
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkPicker/openLinkTarget
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/resolveKey
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/contextFromRow
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/extension/handleConfigurationChange
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/resolveKey
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/constructor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/registerDitaLinkProvider
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/keySpaceViewProvider/KeySpaceViewProvider/_buildTree
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function getGlobalKeySpaceResolver(): KeySpaceResolver`

# Called by

- [keyTargets](../../../../functions/src/editor/linkPicker/keyTargets.md)
- [openLinkTarget](../../../../functions/src/editor/linkPicker/openLinkTarget.md)
- [resolveKey](../../../../functions/src/editor/visualEditorProvider/EditorSession/resolveKey.md)
- [contextFromRow](../../../../functions/src/editor/visualEditorProvider/EditorSession/contextFromRow.md)
- [handleConfigurationChange](../../../../functions/src/extension/handleConfigurationChange.md)
- [resolveKey](../../../../functions/src/preview/mapContexts/MapContexts/resolveKey.md)
- [constructor](../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/constructor.md)
- [registerDitaLinkProvider](../../../../functions/src/providers/ditaLinkProvider/registerDitaLinkProvider.md)
- [_buildTree](../../../../functions/src/providers/keySpaceViewProvider/KeySpaceViewProvider/_buildTree.md)