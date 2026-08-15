---
type: TypeScript Function
title: handleDefinition
resource: server/src/features/definition.ts#L27-L123
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
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
  - target: functions/server/src/utils/referenceParser/findReferenceAtOffset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/definition/resolveElementInFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/referenceParser/getTargetId
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/definition/locationAtFileStart
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/definition/resolveInDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/referenceParser/parseReference
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function handleDefinition( params: DefinitionParams, documents: TextDocuments<TextDocument>, keySpaceService?: KeySpaceService ): Promise<Location | null>`

# Calls

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [effectiveWorkspaceFolders](../../../../../functions/server/src/utils/textUtils/effectiveWorkspaceFolders.md)
- [uriToPath](../../../../../functions/server/src/utils/textUtils/uriToPath.md)
- [getWorkspaceFolders](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/getWorkspaceFolders.md)
- [findReferenceAtOffset](../../../../../functions/server/src/utils/referenceParser/findReferenceAtOffset.md)
- [resolveElementInFile](../../../../../functions/server/src/features/definition/resolveElementInFile.md)
- [getTargetId](../../../../../functions/server/src/utils/referenceParser/getTargetId.md)
- [locationAtFileStart](../../../../../functions/server/src/features/definition/locationAtFileStart.md)
- [resolveInDocument](../../../../../functions/server/src/features/definition/resolveInDocument.md)
- [parseReference](../../../../../functions/server/src/utils/referenceParser/parseReference.md)