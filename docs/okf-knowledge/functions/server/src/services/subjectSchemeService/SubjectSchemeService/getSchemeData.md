---
type: TypeScript Method
title: getSchemeData
resource: server/src/services/subjectSchemeService.ts#L202-L204
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/services/subjectSchemeService/SubjectSchemeService/mergeSchemes
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/ditavalConditions/handleGetSubjectSchemeAttributes
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`getSchemeData(schemePaths: string[]): SubjectSchemeData`

# Calls

- [mergeSchemes](../../../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/mergeSchemes.md)

# Called by

- [handleGetSubjectSchemeAttributes](../../../../../../functions/server/src/features/ditavalConditions/handleGetSubjectSchemeAttributes.md)