---
type: TypeScript Function
title: handleGetSubjectSchemeAttributes
resource: server/src/features/ditavalConditions.ts#L81-L99
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/uriToPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/keySpaceService/KeySpaceService/getSubjectSchemePaths
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/subjectSchemeService/SubjectSchemeService/getSchemeData
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/ditavalConditions/enumerateAttributes
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function handleGetSubjectSchemeAttributes( params: GetSubjectSchemeAttributesParams, subjectSchemeService: SubjectSchemeService, keySpaceService: KeySpaceService | undefined ): Promise<GetSubjectSchemeAttributesResult>`

# Calls

- [uriToPath](../../../../../functions/server/src/utils/textUtils/uriToPath.md)
- [getSubjectSchemePaths](../../../../../functions/server/src/services/keySpaceService/KeySpaceService/getSubjectSchemePaths.md)
- [getSchemeData](../../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/getSchemeData.md)
- [enumerateAttributes](../../../../../functions/server/src/features/ditavalConditions/enumerateAttributes.md)