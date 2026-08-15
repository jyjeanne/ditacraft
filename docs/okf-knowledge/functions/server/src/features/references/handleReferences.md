---
type: TypeScript Function
title: handleReferences
resource: server/src/features/references.ts#L26-L88
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
  - target: functions/server/src/utils/referenceParser/findElementByIdOffset
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
  - target: functions/server/src/features/references/filterMatchingRefs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/workspaceScanner/findCrossFileReferences
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function handleReferences( params: ReferenceParams, documents: TextDocuments<TextDocument>, workspaceFolders?: readonly string[], keySpaceService?: KeySpaceService, log?: (msg: string) => void ): Promise<Location[]>`

# Calls

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [findIdAtOffset](../../../../../functions/server/src/utils/referenceParser/findIdAtOffset.md)
- [findElementByIdOffset](../../../../../functions/server/src/utils/referenceParser/findElementByIdOffset.md)
- [uriToPath](../../../../../functions/server/src/utils/textUtils/uriToPath.md)
- [normalizeFsPath](../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)
- [findReferencesToId](../../../../../functions/server/src/utils/referenceParser/findReferencesToId.md)
- [filterMatchingRefs](../../../../../functions/server/src/features/references/filterMatchingRefs.md)
- [findCrossFileReferences](../../../../../functions/server/src/utils/workspaceScanner/findCrossFileReferences.md)