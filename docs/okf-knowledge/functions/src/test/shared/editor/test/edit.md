---
type: TypeScript Function
title: edit
resource: src/test/shared/editor.test.ts#L37-L42
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toSource/serializeDocument
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/moveTopic/handleComputeMoveEdits
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/extractTopicCommand/extractTopicFromSectionCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/editorInsertUtils/insertAtCursor
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function edit(source: string, change: (tr: Transaction, doc: PMNode) => void): string`

# Calls

- [serializeDocument](../../../../../../functions/src/shared/editor/toSource/serializeDocument.md)

# Called by

- [handleComputeMoveEdits](../../../../../../functions/server/src/features/moveTopic/handleComputeMoveEdits.md)
- [extractTopicFromSectionCommand](../../../../../../functions/src/commands/extractTopicCommand/extractTopicFromSectionCommand.md)
- [insertAtCursor](../../../../../../functions/src/utils/editorInsertUtils/insertAtCursor.md)