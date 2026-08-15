---
type: TypeScript Function
title: findTargetElementName
resource: server/src/features/crossRefValidation.ts#L431-L438
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/escapeRegex
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/crossRefValidation/validateConrefCompatibility
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findTargetElementName(fragment: string, content: string): string | null`

# Calls

- [escapeRegex](../../../../../functions/server/src/utils/textUtils/escapeRegex.md)

# Called by

- [validateConrefCompatibility](../../../../../functions/server/src/features/crossRefValidation/validateConrefCompatibility.md)