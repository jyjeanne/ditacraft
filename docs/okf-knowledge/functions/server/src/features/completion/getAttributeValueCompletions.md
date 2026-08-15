---
type: TypeScript Function
title: getAttributeValueCompletions
resource: server/src/features/completion.ts#L316-L384
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/completion/getKeyrefCompletions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/effectiveWorkspaceFolders
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/uriToPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/getWorkspaceFolders
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/completion/getHrefFragmentCompletions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/completion/getHrefFileCompletions
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/completion/handleCompletion
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function getAttributeValueCompletions( ctx: CompletionContext, documentUri: string, keySpaceService?: KeySpaceService, subjectSchemeService?: SubjectSchemeService ): Promise<CompletionItem[]>`

# Calls

- [getKeyrefCompletions](../../../../../functions/server/src/features/completion/getKeyrefCompletions.md)
- [effectiveWorkspaceFolders](../../../../../functions/server/src/utils/textUtils/effectiveWorkspaceFolders.md)
- [uriToPath](../../../../../functions/server/src/utils/textUtils/uriToPath.md)
- [getWorkspaceFolders](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/getWorkspaceFolders.md)
- [getHrefFragmentCompletions](../../../../../functions/server/src/features/completion/getHrefFragmentCompletions.md)
- [getHrefFileCompletions](../../../../../functions/server/src/features/completion/getHrefFileCompletions.md)

# Called by

- [handleCompletion](../../../../../functions/server/src/features/completion/handleCompletion.md)