---
type: TypeScript Function
title: handleComputeMoveEdits
resource: server/src/features/moveTopic.ts#L160-L288
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/uriToPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/normalizeFsPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/moveTopic/isDirectory
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/workspaceScanner/collectDitaFilesAsync
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/workspaceValidation/mapWithConcurrency
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/moveTopic/readContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/moveTopic/relativeFileReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/moveTopic/referenceValue
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/editor/test/edit
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/test/moveTopic/test/moveFiles
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function handleComputeMoveEdits( params: ComputeMoveEditsParams, documents: TextDocuments<TextDocument>, workspaceFolders: readonly string[] | undefined ): Promise<WorkspaceEdit | null>`

# Calls

- [uriToPath](../../../../../functions/server/src/utils/textUtils/uriToPath.md)
- [normalizeFsPath](../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)
- [isDirectory](../../../../../functions/server/src/features/moveTopic/isDirectory.md)
- [collectDitaFilesAsync](../../../../../functions/server/src/utils/workspaceScanner/collectDitaFilesAsync.md)
- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [mapWithConcurrency](../../../../../functions/server/src/features/workspaceValidation/mapWithConcurrency.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [readContent](../../../../../functions/server/src/features/moveTopic/readContent.md)
- [relativeFileReferences](../../../../../functions/server/src/features/moveTopic/relativeFileReferences.md)
- [referenceValue](../../../../../functions/server/src/features/moveTopic/referenceValue.md)
- [edit](../../../../../functions/src/test/shared/editor/test/edit.md)

# Called by

- [moveFiles](../../../../../functions/server/test/moveTopic/test/moveFiles.md)