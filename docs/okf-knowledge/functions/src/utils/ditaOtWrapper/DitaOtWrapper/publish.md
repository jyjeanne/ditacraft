---
type: TypeScript Method
title: publish
resource: src/utils/ditaOtWrapper.ts#L430-L710
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/normalizeFilePath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/moveTopic/isDirectory
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtOutputChannel/getDitaOtOutputChannel
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtOutputChannel/DitaOtOutputChannel/logBuildStart
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/getProcessTimeoutMs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtOutputChannel/DitaOtOutputChannel/logBuildComplete
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtOutputChannel/DitaOtOutputChannel/logOutput
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/parseProgress
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/previewCommand/generateHtml5OutputIfNeeded
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishCommand/executePublish
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/validateGuideCommand/executeValidation
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/watchModeCommand/runWatchPublish
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`public async publish( options: PublishOptions, progressCallback?: (progress: PublishProgress) => void ): Promise<PublishResult>`

# Calls

- [normalizeFilePath](../../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/normalizeFilePath.md)
- [isDirectory](../../../../../functions/server/src/features/moveTopic/isDirectory.md)
- [getDitaOtOutputChannel](../../../../../functions/src/utils/ditaOtOutputChannel/getDitaOtOutputChannel.md)
- [logBuildStart](../../../../../functions/src/utils/ditaOtOutputChannel/DitaOtOutputChannel/logBuildStart.md)
- [getProcessTimeoutMs](../../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/getProcessTimeoutMs.md)
- [logBuildComplete](../../../../../functions/src/utils/ditaOtOutputChannel/DitaOtOutputChannel/logBuildComplete.md)
- [logOutput](../../../../../functions/src/utils/ditaOtOutputChannel/DitaOtOutputChannel/logOutput.md)
- [parseProgress](../../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/parseProgress.md)

# Called by

- [generateHtml5OutputIfNeeded](../../../../../functions/src/commands/previewCommand/generateHtml5OutputIfNeeded.md)
- [executePublish](../../../../../functions/src/commands/publishCommand/executePublish.md)
- [executeValidation](../../../../../functions/src/commands/validateGuideCommand/executeValidation.md)
- [runWatchPublish](../../../../../functions/src/commands/watchModeCommand/runWatchPublish.md)