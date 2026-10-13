---
type: TypeScript Function
title: handleRename
resource: server/src/features/rename.ts#L114-L158
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/utils/referenceParser/findIdAtOffset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/handleIdRename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/isTopicIdAt
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/referenceParser/findKeyAtOffset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/handleKeyRename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/usageAtOffset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/resolveUsage
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/test/rename/test/renameAt
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function handleRename( params: RenameParams, documents: TextDocuments<TextDocument>, workspaceFolders?: readonly string[], keySpaceService?: KeySpaceService, log?: (msg: string) => void ): Promise<WorkspaceEdit | null>`

# Calls

- [findIdAtOffset](../../../../../functions/server/src/utils/referenceParser/findIdAtOffset.md)
- [handleIdRename](../../../../../functions/server/src/features/rename/handleIdRename.md)
- [isTopicIdAt](../../../../../functions/server/src/features/rename/isTopicIdAt.md)
- [findKeyAtOffset](../../../../../functions/server/src/utils/referenceParser/findKeyAtOffset.md)
- [handleKeyRename](../../../../../functions/server/src/features/rename/handleKeyRename.md)
- [usageAtOffset](../../../../../functions/server/src/features/rename/usageAtOffset.md)
- [resolveUsage](../../../../../functions/server/src/features/rename/resolveUsage.md)

# Called by

- [renameAt](../../../../../functions/server/test/rename/test/renameAt.md)