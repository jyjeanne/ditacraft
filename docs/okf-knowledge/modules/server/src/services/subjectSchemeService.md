---
type: TypeScript Module
title: subjectSchemeService
resource: server/src/services/subjectSchemeService.ts#L1-L504
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/fs
    resolved_by: tree-sitter
    confidence: exact
  - target: external/interfaces
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/server
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [SubjectDefinition](../../../../interfaces/server/src/services/subjectSchemeService/SubjectDefinition.md)
- [SubjectSchemeData](../../../../interfaces/server/src/services/subjectSchemeService/SubjectSchemeData.md)
- [SubjectSchemeQueries](../../../../interfaces/server/src/services/subjectSchemeService/SubjectSchemeQueries.md)
- [SubjectSchemeSnapshot](../../../../classes/server/src/services/subjectSchemeService/SubjectSchemeSnapshot.md)
- [constructor](../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeSnapshot/constructor.md)
- [hasSchemeData](../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeSnapshot/hasSchemeData.md)
- [isControlledAttribute](../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeSnapshot/isControlledAttribute.md)
- [getValidValues](../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeSnapshot/getValidValues.md)
- [getDefaultValue](../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeSnapshot/getDefaultValue.md)
- [getHierarchyPath](../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeSnapshot/getHierarchyPath.md)
- [SubjectSchemeService](../../../../classes/server/src/services/subjectSchemeService/SubjectSchemeService.md)
- [registerSchemes](../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/registerSchemes.md)
- [parseSubjectScheme](../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/parseSubjectScheme.md)
- [getMergedSchemeData](../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/getMergedSchemeData.md)
- [snapshotFor](../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/snapshotFor.md)
- [getSchemeData](../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/getSchemeData.md)
- [mergeSchemes](../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/mergeSchemes.md)
- [getMergedSnapshot](../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/getMergedSnapshot.md)
- [getValidValues](../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/getValidValues.md)
- [isControlledAttribute](../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/isControlledAttribute.md)
- [getHierarchyPath](../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/getHierarchyPath.md)
- [getDefaultValue](../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/getDefaultValue.md)
- [hasSchemeData](../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/hasSchemeData.md)
- [invalidate](../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/invalidate.md)
- [shutdown](../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/shutdown.md)
- [extractSubjectDefinitions](../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/extractSubjectDefinitions.md)
- [parseSubjectDefs](../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/parseSubjectDefs.md)
- [findClosingTag](../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/findClosingTag.md)
- [processEnumerationDefs](../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/processEnumerationDefs.md)
- [buildHierarchyPaths](../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/buildHierarchyPaths.md)
- [flattenKeys](../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/flattenKeys.md)

# Imports

- `fs`
- `./interfaces`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)