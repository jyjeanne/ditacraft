---
type: TypeScript Function
title: pickPreviewFilterCommand
resource: src/commands/previewCommand.ts#L120-L134
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/commands/publishProfilesCommand/promptForDitaval
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/publishProfilesCommand/resolveDitavalPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/info
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/previewPanel/DitaPreviewPanel/getSourceFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/previewCommand/requestPreviewRefresh
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function pickPreviewFilterCommand(): Promise<void>`

# Calls

- [promptForDitaval](../../../../functions/src/commands/publishProfilesCommand/promptForDitaval.md)
- [resolveDitavalPath](../../../../functions/src/commands/publishProfilesCommand/resolveDitavalPath.md)
- [info](../../../../functions/src/utils/logger/Logger/info.md)
- [getSourceFile](../../../../functions/src/providers/previewPanel/DitaPreviewPanel/getSourceFile.md)
- [requestPreviewRefresh](../../../../functions/src/commands/previewCommand/requestPreviewRefresh.md)