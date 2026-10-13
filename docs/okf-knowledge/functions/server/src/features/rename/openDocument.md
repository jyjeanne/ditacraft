---
type: TypeScript Function
title: openDocument
resource: server/src/features/rename.ts#L235-L244
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/readFile
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/rename/resolveUsage
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function openDocument(filePath: string, documents: TextDocuments<TextDocument>): Promise<TextDocument | undefined>`

# Calls

- [readFile](../../../../../functions/webview/editor/readFile.md)

# Called by

- [resolveUsage](../../../../../functions/server/src/features/rename/resolveUsage.md)