---
type: TypeScript Function
title: enumerateAttributes
resource: server/src/features/ditavalConditions.ts#L64-L79
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/ditavalConditions/handleGetSubjectSchemeAttributes
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function enumerateAttributes(data: SubjectSchemeData): SchemeAttributeInfo[]`

# Calls

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)

# Called by

- [handleGetSubjectSchemeAttributes](../../../../../functions/server/src/features/ditavalConditions/handleGetSubjectSchemeAttributes.md)