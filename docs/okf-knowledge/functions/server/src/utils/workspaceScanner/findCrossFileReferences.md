---
type: TypeScript Function
title: findCrossFileReferences
resource: server/src/utils/workspaceScanner.ts#L146-L202
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/normalizeFsPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/referenceParser/findReferencesToId
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/workspaceScanner/referenceMatchesTarget
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/references/handleReferences
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function findCrossFileReferences( targetId: string, targetFilePath: string, workspaceFolders: readonly string[], excludeUri?: string, documents?: TextDocuments<TextDocument>, keySpaceService?: KeySpaceService, log?: (msg: string) => void ): Promise<Location[]>`

# Calls

- [normalizeFsPath](../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)
- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [findReferencesToId](../../../../../functions/server/src/utils/referenceParser/findReferencesToId.md)
- [referenceMatchesTarget](../../../../../functions/server/src/utils/workspaceScanner/referenceMatchesTarget.md)

# Called by

- [handleReferences](../../../../../functions/server/src/features/references/handleReferences.md)