---
type: TypeScript Function
title: areConrefCompatible
resource: server/src/features/crossRefValidation.ts#L419-L425
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/crossRefValidation/validateConrefCompatibility
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function areConrefCompatible(sourceElement: string, targetElement: string): boolean`

# Calls

- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)

# Called by

- [validateCrossReferences](../../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)
- [validateConrefCompatibility](../../../../../functions/server/src/features/crossRefValidation/validateConrefCompatibility.md)