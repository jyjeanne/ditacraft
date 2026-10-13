---
type: TypeScript Function
title: handleComputeFindReplaceEdits
resource: server/src/features/findReplace.ts#L195-L283
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/features/findReplace/buildSearchPattern
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/uriToPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/workspaceScanner/collectDitaFilesAsync
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/workspaceValidation/mapWithConcurrency
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/readFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/findReplace/searchableSpans
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/findReplace/cutsReference
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/offsetToRange
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/findReplace/expandReplacement
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/test/findReplace/test/matched
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function handleComputeFindReplaceEdits( params: FindReplaceParams, documents: TextDocuments<TextDocument>, workspaceFolders: readonly string[] | undefined ): Promise<FindReplaceResult>`

# Calls

- [buildSearchPattern](../../../../../functions/server/src/features/findReplace/buildSearchPattern.md)
- [uriToPath](../../../../../functions/server/src/utils/textUtils/uriToPath.md)
- [collectDitaFilesAsync](../../../../../functions/server/src/utils/workspaceScanner/collectDitaFilesAsync.md)
- [mapWithConcurrency](../../../../../functions/server/src/features/workspaceValidation/mapWithConcurrency.md)
- [readFile](../../../../../functions/webview/editor/readFile.md)
- [searchableSpans](../../../../../functions/server/src/features/findReplace/searchableSpans.md)
- [cutsReference](../../../../../functions/server/src/features/findReplace/cutsReference.md)
- [offsetToRange](../../../../../functions/server/src/utils/textUtils/offsetToRange.md)
- [expandReplacement](../../../../../functions/server/src/features/findReplace/expandReplacement.md)

# Called by

- [matched](../../../../../functions/server/test/findReplace/test/matched.md)