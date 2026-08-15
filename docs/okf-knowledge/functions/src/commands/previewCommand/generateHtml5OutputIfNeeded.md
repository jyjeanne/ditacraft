---
type: TypeScript Function
title: generateHtml5OutputIfNeeded
resource: src/commands/previewCommand.ts#L323-L374
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/getOutputDirectory
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/previewCommand/computeFilterSuffix
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/publish
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/toVsCodeProgressReporter
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/previewCommand/previewHTML5Command
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function generateHtml5OutputIfNeeded( ditaOt: DitaOtWrapper, filePath: string, ditavalPath: string | undefined ): Promise<string>`

# Calls

- [getOutputDirectory](../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/getOutputDirectory.md)
- [computeFilterSuffix](../../../../functions/src/commands/previewCommand/computeFilterSuffix.md)
- [publish](../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/publish.md)
- [toVsCodeProgressReporter](../../../../functions/src/utils/ditaOtWrapper/toVsCodeProgressReporter.md)

# Called by

- [previewHTML5Command](../../../../functions/src/commands/previewCommand/previewHTML5Command.md)