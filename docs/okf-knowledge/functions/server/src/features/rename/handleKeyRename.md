---
type: TypeScript Function
title: handleKeyRename
resource: server/src/features/rename.ts#L320-L422
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
  - target: functions/server/src/utils/referenceParser/countKeyDefinitionOccurrences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/referenceParser/findReferencesToKey
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/collectMatchingKeyEdits
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

`async function handleKeyRename( document: TextDocument, text: string, keyResult: KeyAtOffset, newKey: string, documents: TextDocuments<TextDocument>, workspaceFolders?: readonly string[], keySpaceService?: KeySpaceService, log?: (msg: string) => void ): Promise<WorkspaceEdit | null>`

# Calls

- [uriToPath](../../../../../functions/server/src/utils/textUtils/uriToPath.md)
- [normalizeFsPath](../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)
- [countKeyDefinitionOccurrences](../../../../../functions/server/src/utils/referenceParser/countKeyDefinitionOccurrences.md)
- [findReferencesToKey](../../../../../functions/server/src/utils/referenceParser/findReferencesToKey.md)
- [collectMatchingKeyEdits](../../../../../functions/server/src/features/rename/collectMatchingKeyEdits.md)
- [collectCrossFileEdits](../../../../../functions/server/src/features/rename/collectCrossFileEdits.md)

# Called by

- [handleRename](../../../../../functions/server/src/features/rename/handleRename.md)