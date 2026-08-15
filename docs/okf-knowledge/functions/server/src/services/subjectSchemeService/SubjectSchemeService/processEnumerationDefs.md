---
type: TypeScript Method
title: processEnumerationDefs
resource: server/src/services/subjectSchemeService.ts#L414-L466
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/services/subjectSchemeService/SubjectSchemeService/flattenKeys
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/subjectSchemeService/SubjectSchemeService/parseSubjectScheme
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private processEnumerationDefs( content: string, subjectDefs: Map<string, SubjectDefinition>, data: SubjectSchemeData ): void`

# Calls

- [get](../../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [flattenKeys](../../../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/flattenKeys.md)

# Called by

- [parseSubjectScheme](../../../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/parseSubjectScheme.md)