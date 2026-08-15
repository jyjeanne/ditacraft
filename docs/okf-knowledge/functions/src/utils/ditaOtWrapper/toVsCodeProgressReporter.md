---
type: TypeScript Function
title: toVsCodeProgressReporter
resource: src/utils/ditaOtWrapper.ts#L52-L63
generated:
  by: okf-rs/0.4.0
relationships:
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
---

# Signature

`function toVsCodeProgressReporter( progress: vscode.Progress<{ increment?: number; message?: string }> ): (publishProgress: PublishProgress) => void`

# Called by

- [generateHtml5OutputIfNeeded](../../../../functions/src/commands/previewCommand/generateHtml5OutputIfNeeded.md)
- [executePublish](../../../../functions/src/commands/publishCommand/executePublish.md)
- [executeValidation](../../../../functions/src/commands/validateGuideCommand/executeValidation.md)