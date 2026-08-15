---
type: TypeScript Function
title: handleRename
resource: server/src/features/rename.ts#L71-L135
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/referenceParser/findIdAtOffset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/referenceParser/findKeyAtOffset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/handleKeyRename
    resolved_by: tree-sitter
    confidence: exact
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
---

# Signature

`async function handleRename( params: RenameParams, documents: TextDocuments<TextDocument>, workspaceFolders?: readonly string[], keySpaceService?: KeySpaceService, log?: (msg: string) => void ): Promise<WorkspaceEdit | null>`

# Calls

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [findIdAtOffset](../../../../../functions/server/src/utils/referenceParser/findIdAtOffset.md)
- [findKeyAtOffset](../../../../../functions/server/src/utils/referenceParser/findKeyAtOffset.md)
- [handleKeyRename](../../../../../functions/server/src/features/rename/handleKeyRename.md)
- [uriToPath](../../../../../functions/server/src/utils/textUtils/uriToPath.md)
- [normalizeFsPath](../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)
- [findReferencesToId](../../../../../functions/server/src/utils/referenceParser/findReferencesToId.md)
- [collectMatchingEdits](../../../../../functions/server/src/features/rename/collectMatchingEdits.md)
- [collectCrossFileEdits](../../../../../functions/server/src/features/rename/collectCrossFileEdits.md)