---
type: TypeScript Module
title: previewCommand
resource: src/commands/previewCommand.ts#L1-L458
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
  - target: external/fs
    resolved_by: tree-sitter
    confidence: exact
  - target: external/crypto
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-ditaotwrapper
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-logger
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-errorutils
    resolved_by: tree-sitter
    confidence: exact
  - target: external/providers-previewpanel
    resolved_by: tree-sitter
    confidence: exact
  - target: external/publishprofilescommand
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [getActiveDitavalPath](../../../functions/src/commands/previewCommand/getActiveDitavalPath.md)
- [requestPreviewRefresh](../../../functions/src/commands/previewCommand/requestPreviewRefresh.md)
- [isPreviewRefreshInFlight](../../../functions/src/commands/previewCommand/isPreviewRefreshInFlight.md)
- [initializePreview](../../../functions/src/commands/previewCommand/initializePreview.md)
- [pickPreviewFilterCommand](../../../functions/src/commands/previewCommand/pickPreviewFilterCommand.md)
- [previewHTML5Command](../../../functions/src/commands/previewCommand/previewHTML5Command.md)
- [shouldAutoRefreshPreview](../../../functions/src/commands/previewCommand/shouldAutoRefreshPreview.md)
- [pathsEqual](../../../functions/src/commands/previewCommand/pathsEqual.md)
- [getAndValidateFileUri](../../../functions/src/commands/previewCommand/getAndValidateFileUri.md)
- [validateFilePath](../../../functions/src/commands/previewCommand/validateFilePath.md)
- [initializeAndValidateDitaOt](../../../functions/src/commands/previewCommand/initializeAndValidateDitaOt.md)
- [validateInputFile](../../../functions/src/commands/previewCommand/validateInputFile.md)
- [computeFilterSuffix](../../../functions/src/commands/previewCommand/computeFilterSuffix.md)
- [generateHtml5OutputIfNeeded](../../../functions/src/commands/previewCommand/generateHtml5OutputIfNeeded.md)
- [displayPreview](../../../functions/src/commands/previewCommand/displayPreview.md)
- [handlePreviewError](../../../functions/src/commands/previewCommand/handlePreviewError.md)
- [findMainHtmlFile](../../../functions/src/commands/previewCommand/findMainHtmlFile.md)

# Imports

- `vscode`
- `path`
- `fs/promises`
- `fs`
- `crypto`
- `../utils/ditaOtWrapper`
- `../utils/logger`
- `../utils/errorUtils`
- `../providers/previewPanel`
- `./publishProfilesCommand`

# Member of

- [ditacraft](../../../packages/ditacraft.md)