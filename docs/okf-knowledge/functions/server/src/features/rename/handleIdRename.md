---
type: TypeScript Function
title: handleIdRename
resource: server/src/features/rename.ts#L305-L355
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
  - target: functions/server/src/utils/referenceParser/findReferencesToId
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/collectMatchingEdits
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/collectCrossFileEdits
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/rename/handleRename
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function handleIdRename( document: TextDocument, text: string, idResult: IdAtOffset, newId: string, isTopicId: boolean, documents: TextDocuments<TextDocument>, workspaceFolders?: readonly string[], keySpaceService?: KeySpaceService, log?: (msg: string) => void ): Promise<WorkspaceEdit | null>`

# Calls

- [uriToPath](../../../../../functions/server/src/utils/textUtils/uriToPath.md)
- [normalizeFsPath](../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)
- [findReferencesToId](../../../../../functions/server/src/utils/referenceParser/findReferencesToId.md)
- [collectMatchingEdits](../../../../../functions/server/src/features/rename/collectMatchingEdits.md)
- [collectCrossFileEdits](../../../../../functions/server/src/features/rename/collectCrossFileEdits.md)

# Called by

- [handleRename](../../../../../functions/server/src/features/rename/handleRename.md)