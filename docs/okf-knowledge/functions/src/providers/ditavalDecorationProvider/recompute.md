---
type: TypeScript Function
title: recompute
resource: src/providers/ditavalDecorationProvider.ts#L141-L195
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/utils/constants/isDitaContentUri
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalDecorationProvider/exceedsLargeFileThreshold
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalDecorationProvider/clearDecorations
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/previewCommand/getActiveDitavalPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalDecorationProvider/loadActiveFilter
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/conditionMarks/conditionMarks
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalDecorationProvider/flagDecorationType
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditavalDecorationProvider/flagHover
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
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

- [isDitaContentUri](../../../../functions/src/utils/constants/isDitaContentUri.md)
- [exceedsLargeFileThreshold](../../../../functions/src/providers/ditavalDecorationProvider/exceedsLargeFileThreshold.md)
- [clearDecorations](../../../../functions/src/providers/ditavalDecorationProvider/clearDecorations.md)
- [getActiveDitavalPath](../../../../functions/src/commands/previewCommand/getActiveDitavalPath.md)
- [loadActiveFilter](../../../../functions/src/providers/ditavalDecorationProvider/loadActiveFilter.md)
- [conditionMarks](../../../../functions/src/preview/conditionMarks/conditionMarks.md)
- [flagDecorationType](../../../../functions/src/providers/ditavalDecorationProvider/flagDecorationType.md)
- [flagHover](../../../../functions/src/providers/ditavalDecorationProvider/flagHover.md)
- [has](../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [scheduleRecompute](../../../../functions/src/providers/ditavalDecorationProvider/scheduleRecompute.md)