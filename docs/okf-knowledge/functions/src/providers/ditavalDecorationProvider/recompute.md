---
type: TypeScript Function
title: recompute
resource: src/providers/ditavalDecorationProvider.ts#L81-L131
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/constants/isDitaContentUri
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalDecorationProvider/exceedsLargeFileThreshold
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/previewCommand/getActiveDitavalPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalDecorationProvider/loadActiveRules
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/debug
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/xmlElementScanner/findProfiledElements
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditavalParser/isExcludedByRules
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/ditavalDecorationProvider/scheduleRecompute
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function recompute(editor: vscode.TextEditor | undefined): Promise<void>`

# Calls

- [get](../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [isDitaContentUri](../../../../functions/src/utils/constants/isDitaContentUri.md)
- [exceedsLargeFileThreshold](../../../../functions/src/providers/ditavalDecorationProvider/exceedsLargeFileThreshold.md)
- [getActiveDitavalPath](../../../../functions/src/commands/previewCommand/getActiveDitavalPath.md)
- [loadActiveRules](../../../../functions/src/providers/ditavalDecorationProvider/loadActiveRules.md)
- [debug](../../../../functions/src/utils/logger/Logger/debug.md)
- [findProfiledElements](../../../../functions/src/utils/xmlElementScanner/findProfiledElements.md)
- [isExcludedByRules](../../../../functions/src/utils/ditavalParser/isExcludedByRules.md)

# Called by

- [scheduleRecompute](../../../../functions/src/providers/ditavalDecorationProvider/scheduleRecompute.md)