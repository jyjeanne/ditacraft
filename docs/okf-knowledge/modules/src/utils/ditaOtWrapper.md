---
type: TypeScript Module
title: ditaOtWrapper
resource: src/utils/ditaOtWrapper.ts#L1-L852
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
  - target: external/fs
    resolved_by: tree-sitter
    confidence: exact
  - target: external/child-process
    resolved_by: tree-sitter
    confidence: exact
  - target: external/util
    resolved_by: tree-sitter
    confidence: exact
  - target: external/logger
    resolved_by: tree-sitter
    confidence: exact
  - target: external/ditaotoutputchannel
    resolved_by: tree-sitter
    confidence: exact
  - target: external/constants
    resolved_by: tree-sitter
    confidence: exact
  - target: external/configurationmanager
    resolved_by: tree-sitter
    confidence: exact
  - target: external/pathutils
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [DitaOtConfig](../../../interfaces/src/utils/ditaOtWrapper/DitaOtConfig.md)
- [PublishOptions](../../../interfaces/src/utils/ditaOtWrapper/PublishOptions.md)
- [PublishProgress](../../../interfaces/src/utils/ditaOtWrapper/PublishProgress.md)
- [toVsCodeProgressReporter](../../../functions/src/utils/ditaOtWrapper/toVsCodeProgressReporter.md)
- [PublishResult](../../../interfaces/src/utils/ditaOtWrapper/PublishResult.md)
- [DitaOtWrapper](../../../classes/src/utils/ditaOtWrapper/DitaOtWrapper.md)
- [constructor](../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/constructor.md)
- [loadConfiguration](../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/loadConfiguration.md)
- [getProcessTimeoutMs](../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/getProcessTimeoutMs.md)
- [isValidPath](../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/isValidPath.md)
- [reloadConfiguration](../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/reloadConfiguration.md)
- [detectDitaOtCommand](../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/detectDitaOtCommand.md)
- [verifyInstallation](../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/verifyInstallation.md)
- [getAvailableTranstypes](../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/getAvailableTranstypes.md)
- [publish](../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/publish.md)
- [parseProgress](../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/parseProgress.md)
- [getOutputDirectory](../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/getOutputDirectory.md)
- [getDefaultTranstype](../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/getDefaultTranstype.md)
- [configureOtPath](../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/configureOtPath.md)
- [normalizeFilePath](../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/normalizeFilePath.md)
- [validateInputFile](../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/validateInputFile.md)

# Imports

- `vscode`
- `path`
- `fs`
- `child_process`
- `util`
- `./logger`
- `./ditaOtOutputChannel`
- `./constants`
- `./configurationManager`
- `./pathUtils`

# Member of

- [ditacraft](../../../packages/ditacraft.md)