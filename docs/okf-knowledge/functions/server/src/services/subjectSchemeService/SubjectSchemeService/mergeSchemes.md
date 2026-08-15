---
type: TypeScript Method
title: mergeSchemes
resource: server/src/services/subjectSchemeService.ts#L207-L251
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/services/subjectSchemeService/SubjectSchemeService/parseSubjectScheme
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/subjectSchemeService/SubjectSchemeService/getMergedSchemeData
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/subjectSchemeService/SubjectSchemeService/snapshotFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/subjectSchemeService/SubjectSchemeService/getSchemeData
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private mergeSchemes(schemePaths: string[]): SubjectSchemeData`

# Calls

- [parseSubjectScheme](../../../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/parseSubjectScheme.md)
- [get](../../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)

# Called by

- [getMergedSchemeData](../../../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/getMergedSchemeData.md)
- [snapshotFor](../../../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/snapshotFor.md)
- [getSchemeData](../../../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/getSchemeData.md)