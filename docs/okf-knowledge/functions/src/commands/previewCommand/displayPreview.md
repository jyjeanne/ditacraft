---
type: TypeScript Function
title: displayPreview
resource: src/commands/previewCommand.ts#L431-L464
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/previewCommand/findMainHtmlFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/warn
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/previewCommand/previewDitaOtCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function displayPreview( sourceFilePath: string, outputDir: string, preserveFocus = false, ditavalPath?: string ): Promise<void>`

# Calls

- [basename](../../../../functions/src/shared/render/toHtml/basename.md)
- [findMainHtmlFile](../../../../functions/src/commands/previewCommand/findMainHtmlFile.md)
- [warn](../../../../functions/src/utils/logger/Logger/warn.md)

# Called by

- [previewDitaOtCommand](../../../../functions/src/commands/previewCommand/previewDitaOtCommand.md)