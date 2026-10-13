---
type: TypeScript Function
title: readContent
resource: server/src/features/moveTopic.ts#L148-L158
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/readFile
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/moveTopic/handleComputeMoveEdits
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function readContent(filePath: string, documents: TextDocuments<TextDocument>): Promise<string | undefined>`

# Calls

- [readFile](../../../../../functions/webview/editor/readFile.md)

# Called by

- [handleComputeMoveEdits](../../../../../functions/server/src/features/moveTopic/handleComputeMoveEdits.md)