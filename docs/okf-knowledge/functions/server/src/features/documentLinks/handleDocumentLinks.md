---
type: TypeScript Function
title: handleDocumentLinks
resource: server/src/features/documentLinks.ts#L28-L66
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/uriToPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/effectiveWorkspaceFolders
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/getWorkspaceFolders
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/documentLinks/getCommentRanges
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/documentLinks/processFileRefs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/documentLinks/processKeyRefs
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function handleDocumentLinks( params: DocumentLinkParams, documents: TextDocuments<TextDocument>, keySpaceService?: KeySpaceService ): Promise<DocumentLink[]>`

# Calls

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [uriToPath](../../../../../functions/server/src/utils/textUtils/uriToPath.md)
- [effectiveWorkspaceFolders](../../../../../functions/server/src/utils/textUtils/effectiveWorkspaceFolders.md)
- [getWorkspaceFolders](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/getWorkspaceFolders.md)
- [getCommentRanges](../../../../../functions/server/src/features/documentLinks/getCommentRanges.md)
- [processFileRefs](../../../../../functions/server/src/features/documentLinks/processFileRefs.md)
- [processKeyRefs](../../../../../functions/server/src/features/documentLinks/processKeyRefs.md)