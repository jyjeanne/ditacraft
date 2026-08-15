---
type: TypeScript Method
title: parseSubjectScheme
resource: server/src/services/subjectSchemeService.ts#L122-L159
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/subjectSchemeService/SubjectSchemeService/extractSubjectDefinitions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/subjectSchemeService/SubjectSchemeService/buildHierarchyPaths
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/subjectSchemeService/SubjectSchemeService/processEnumerationDefs
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/subjectSchemeService/SubjectSchemeService/mergeSchemes
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`parseSubjectScheme(mapFilePath: string): SubjectSchemeData`

# Calls

- [get](../../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [extractSubjectDefinitions](../../../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/extractSubjectDefinitions.md)
- [buildHierarchyPaths](../../../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/buildHierarchyPaths.md)
- [processEnumerationDefs](../../../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/processEnumerationDefs.md)

# Called by

- [mergeSchemes](../../../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/mergeSchemes.md)