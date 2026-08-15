---
type: TypeScript Function
title: handleHover
resource: server/src/features/hover.ts#L24-L84
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/referenceParser/findReferenceAtOffset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/hover/getKeyrefHover
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
  - target: functions/server/src/features/hover/getHrefHover
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/hover/getWordAt
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/test/hover/test/hover
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function handleHover( params: HoverParams, documents: TextDocuments<TextDocument>, keySpaceService?: KeySpaceService ): Promise<Hover | null>`

# Calls

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [findReferenceAtOffset](../../../../../functions/server/src/utils/referenceParser/findReferenceAtOffset.md)
- [getKeyrefHover](../../../../../functions/server/src/features/hover/getKeyrefHover.md)
- [effectiveWorkspaceFolders](../../../../../functions/server/src/utils/textUtils/effectiveWorkspaceFolders.md)
- [uriToPath](../../../../../functions/server/src/utils/textUtils/uriToPath.md)
- [getWorkspaceFolders](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/getWorkspaceFolders.md)
- [getHrefHover](../../../../../functions/server/src/features/hover/getHrefHover.md)
- [getWordAt](../../../../../functions/server/src/features/hover/getWordAt.md)

# Called by

- [hover](../../../../../functions/server/test/hover/test/hover.md)