---
type: TypeScript Method
title: extractSubjectDefinitions
resource: server/src/services/subjectSchemeService.ts#L318-L331
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/services/subjectSchemeService/SubjectSchemeService/parseSubjectDefs
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/services/subjectSchemeService/SubjectSchemeService/parseSubjectScheme
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private extractSubjectDefinitions( content: string ): Map<string, SubjectDefinition>`

# Calls

- [parseSubjectDefs](../../../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/parseSubjectDefs.md)

# Called by

- [parseSubjectScheme](../../../../../../functions/server/src/services/subjectSchemeService/SubjectSchemeService/parseSubjectScheme.md)