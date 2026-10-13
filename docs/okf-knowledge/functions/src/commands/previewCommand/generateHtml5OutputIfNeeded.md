---
type: TypeScript Function
title: generateHtml5OutputIfNeeded
resource: src/commands/previewCommand.ts#L375-L426
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
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
  - target: functions/src/commands/previewCommand/previewDitaOtCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function generateHtml5OutputIfNeeded( ditaOt: DitaOtWrapper, filePath: string, ditavalPath: string | undefined ): Promise<string>`

# Calls

- [basename](../../../../functions/src/shared/render/toHtml/basename.md)
- [getOutputDirectory](../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/getOutputDirectory.md)
- [computeFilterSuffix](../../../../functions/src/commands/previewCommand/computeFilterSuffix.md)
- [publish](../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/publish.md)
- [toVsCodeProgressReporter](../../../../functions/src/utils/ditaOtWrapper/toVsCodeProgressReporter.md)

# Called by

- [previewDitaOtCommand](../../../../functions/src/commands/previewCommand/previewDitaOtCommand.md)