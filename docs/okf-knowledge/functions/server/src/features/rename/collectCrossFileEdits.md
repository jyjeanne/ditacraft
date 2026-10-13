---
type: TypeScript Function
title: collectCrossFileEdits
resource: server/src/features/rename.ts#L366-L417
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/utils/workspaceScanner/collectDitaFilesAsync
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/workspaceValidation/mapWithConcurrency
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/readFile
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/rename/handleIdRename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/handleKeyRename
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function collectCrossFileEdits( workspaceFolders: readonly string[] | undefined, currentUri: string, documents: TextDocuments<TextDocument>, findRefs: (content: string) => ReferenceOccurrence[], buildEdits: (refs: ReferenceOccurrence[], content: string, filePath: string) => Promise<TextEdit[]> ): Promise<{ [uri: string]: TextEdit[] }>`

# Calls

- [collectDitaFilesAsync](../../../../../functions/server/src/utils/workspaceScanner/collectDitaFilesAsync.md)
- [mapWithConcurrency](../../../../../functions/server/src/features/workspaceValidation/mapWithConcurrency.md)
- [readFile](../../../../../functions/webview/editor/readFile.md)

# Called by

- [handleIdRename](../../../../../functions/server/src/features/rename/handleIdRename.md)
- [handleKeyRename](../../../../../functions/server/src/features/rename/handleKeyRename.md)