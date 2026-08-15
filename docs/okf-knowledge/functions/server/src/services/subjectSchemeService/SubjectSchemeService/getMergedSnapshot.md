---
type: TypeScript Method
title: getMergedSnapshot
resource: server/src/services/subjectSchemeService.ts#L255-L263
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/services/subjectSchemeService/SubjectSchemeService/getMergedSchemeData
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/subjectSchemeService/SubjectSchemeService/getValidValues
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/subjectSchemeService/SubjectSchemeService/isControlledAttribute
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/subjectSchemeService/SubjectSchemeService/getHierarchyPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/subjectSchemeService/SubjectSchemeService/getDefaultValue
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private getMergedSnapshot(): SubjectSchemeSnapshot`

# Calls

- [getMergedSchemeData](../../../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/getMergedSchemeData.md)

# Called by

- [getValidValues](../../../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/getValidValues.md)
- [isControlledAttribute](../../../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/isControlledAttribute.md)
- [getHierarchyPath](../../../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/getHierarchyPath.md)
- [getDefaultValue](../../../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/getDefaultValue.md)