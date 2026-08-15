---
type: TypeScript Function
title: handleComputeMoveEdits
resource: server/src/features/moveTopic.ts#L68-L168
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/uriToPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/normalizeFsPath
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
  - target: functions/server/src/utils/referenceParser/findFileReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/referenceParser/parseReference
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/moveTopic/toHrefPath
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function handleComputeMoveEdits( params: ComputeMoveEditsParams, documents: TextDocuments<TextDocument>, workspaceFolders: readonly string[] | undefined ): Promise<WorkspaceEdit | null>`

# Calls

- [uriToPath](../../../../../functions/server/src/utils/textUtils/uriToPath.md)
- [normalizeFsPath](../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)
- [collectDitaFilesAsync](../../../../../functions/server/src/utils/workspaceScanner/collectDitaFilesAsync.md)
- [mapWithConcurrency](../../../../../functions/server/src/features/workspaceValidation/mapWithConcurrency.md)
- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [findFileReferences](../../../../../functions/server/src/utils/referenceParser/findFileReferences.md)
- [parseReference](../../../../../functions/server/src/utils/referenceParser/parseReference.md)
- [toHrefPath](../../../../../functions/server/src/features/moveTopic/toHrefPath.md)