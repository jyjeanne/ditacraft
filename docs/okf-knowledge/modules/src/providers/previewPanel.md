---
type: TypeScript Module
title: previewPanel
resource: src/providers/previewPanel.ts#L1-L1065
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/vscode
    resolved_by: tree-sitter
    confidence: exact
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/fs-promises
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-logger
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-errorutils
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-configurationmanager
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [DitaPreviewPanel](../../../classes/src/providers/previewPanel/DitaPreviewPanel.md)
- [createOrShow](../../../functions/src/providers/previewPanel/DitaPreviewPanel/createOrShow.md)
- [revive](../../../functions/src/providers/previewPanel/DitaPreviewPanel/revive.md)
- [constructor](../../../functions/src/providers/previewPanel/DitaPreviewPanel/constructor.md)
- [update](../../../functions/src/providers/previewPanel/DitaPreviewPanel/update.md)
- [refresh](../../../functions/src/providers/previewPanel/DitaPreviewPanel/refresh.md)
- [getSourceFile](../../../functions/src/providers/previewPanel/DitaPreviewPanel/getSourceFile.md)
- [_handleSetTheme](../../../functions/src/providers/previewPanel/DitaPreviewPanel/_handleSetTheme.md)
- [_setupEditorScrollSync](../../../functions/src/providers/previewPanel/DitaPreviewPanel/_setupEditorScrollSync.md)
- [_handleEditorScroll](../../../functions/src/providers/previewPanel/DitaPreviewPanel/_handleEditorScroll.md)
- [_handleEditorCursorChange](../../../functions/src/providers/previewPanel/DitaPreviewPanel/_handleEditorCursorChange.md)
- [_handlePreviewScroll](../../../functions/src/providers/previewPanel/DitaPreviewPanel/_handlePreviewScroll.md)
- [dispose](../../../functions/src/providers/previewPanel/DitaPreviewPanel/dispose.md)
- [_update](../../../functions/src/providers/previewPanel/DitaPreviewPanel/_update.md)
- [_getNoContentHtml](../../../functions/src/providers/previewPanel/DitaPreviewPanel/_getNoContentHtml.md)
- [_getHtmlForWebviewAsync](../../../functions/src/providers/previewPanel/DitaPreviewPanel/_getHtmlForWebviewAsync.md)
- [_convertLocalResourcesAsync](../../../functions/src/providers/previewPanel/DitaPreviewPanel/_convertLocalResourcesAsync.md)
- [_sanitizeCss](../../../functions/src/providers/previewPanel/DitaPreviewPanel/_sanitizeCss.md)
- [_loadCustomCssAsync](../../../functions/src/providers/previewPanel/DitaPreviewPanel/_loadCustomCssAsync.md)
- [_injectPreviewEnhancementsAsync](../../../functions/src/providers/previewPanel/DitaPreviewPanel/_injectPreviewEnhancementsAsync.md)
- [_getErrorHtml](../../../functions/src/providers/previewPanel/DitaPreviewPanel/_getErrorHtml.md)
- [_escapeHtml](../../../functions/src/providers/previewPanel/DitaPreviewPanel/_escapeHtml.md)
- [registerPreviewPanelSerializer](../../../functions/src/providers/previewPanel/registerPreviewPanelSerializer.md)

# Imports

- `vscode`
- `path`
- `fs/promises`
- `../utils/logger`
- `../utils/errorUtils`
- `../utils/configurationManager`

# Member of

- [ditacraft](../../../packages/ditacraft.md)