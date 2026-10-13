---
type: TypeScript Function
title: handlePrepareRename
resource: server/src/features/rename.ts#L68-L103
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/utils/referenceParser/findIdAtOffset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/referenceParser/findKeyAtOffset
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

`async function handlePrepareRename( params: PrepareRenameParams, documents: TextDocuments<TextDocument>, keySpaceService?: KeySpaceService, workspaceFolders?: readonly string[] ): Promise<Range | null>`

# Calls

- [findIdAtOffset](../../../../../functions/server/src/utils/referenceParser/findIdAtOffset.md)
- [findKeyAtOffset](../../../../../functions/server/src/utils/referenceParser/findKeyAtOffset.md)
- [usageAtOffset](../../../../../functions/server/src/features/rename/usageAtOffset.md)
- [resolveUsage](../../../../../functions/server/src/features/rename/resolveUsage.md)

# Called by

- [renameAt](../../../../../functions/server/test/rename/test/renameAt.md)