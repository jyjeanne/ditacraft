---
type: TypeScript Function
title: resolveUsage
resource: server/src/features/rename.ts#L173-L232
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/uriToPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/resolveKeyEntry
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/openDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/findKeyDefinition
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/referenceParser/extractKeyPart
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/findIdDefinition
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/rename/handlePrepareRename
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/rename/handleRename
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function resolveUsage( document: TextDocument, usage: Usage, documents: TextDocuments<TextDocument>, keySpaceService: KeySpaceService | undefined, workspaceFolders: readonly string[] | undefined ): Promise<ResolvedUsage>`

# Calls

- [uriToPath](../../../../../functions/server/src/utils/textUtils/uriToPath.md)
- [resolveKeyEntry](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/resolveKeyEntry.md)
- [openDocument](../../../../../functions/server/src/features/rename/openDocument.md)
- [findKeyDefinition](../../../../../functions/server/src/features/rename/findKeyDefinition.md)
- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)
- [extractKeyPart](../../../../../functions/server/src/utils/referenceParser/extractKeyPart.md)
- [findIdDefinition](../../../../../functions/server/src/features/rename/findIdDefinition.md)

# Called by

- [handlePrepareRename](../../../../../functions/server/src/features/rename/handlePrepareRename.md)
- [handleRename](../../../../../functions/server/src/features/rename/handleRename.md)