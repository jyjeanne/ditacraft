---
type: TypeScript Function
title: displayPreview
resource: src/commands/previewCommand.ts#L379-L412
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/commands/previewCommand/findMainHtmlFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/info
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/warn
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/previewCommand/previewHTML5Command
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function displayPreview( sourceFilePath: string, outputDir: string, preserveFocus = false, ditavalPath?: string ): Promise<void>`

# Calls

- [findMainHtmlFile](../../../../functions/src/commands/previewCommand/findMainHtmlFile.md)
- [info](../../../../functions/src/utils/logger/Logger/info.md)
- [warn](../../../../functions/src/utils/logger/Logger/warn.md)

# Called by

- [previewHTML5Command](../../../../functions/src/commands/previewCommand/previewHTML5Command.md)