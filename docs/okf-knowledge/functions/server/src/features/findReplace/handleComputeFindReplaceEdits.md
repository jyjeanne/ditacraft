---
type: TypeScript Function
title: handleComputeFindReplaceEdits
resource: server/src/features/findReplace.ts#L100-L182
generated:
  by: okf-rs/0.4.0
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
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/offsetToRange
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/findReplace/expandReplacement
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
- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [offsetToRange](../../../../../functions/server/src/utils/textUtils/offsetToRange.md)
- [expandReplacement](../../../../../functions/server/src/features/findReplace/expandReplacement.md)