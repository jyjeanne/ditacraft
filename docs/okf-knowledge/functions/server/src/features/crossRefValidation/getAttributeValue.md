---
type: TypeScript Function
title: getAttributeValue
resource: server/src/features/crossRefValidation.ts#L470-L476
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/features/crossRefValidation/getContainingTag
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/escapeRegex
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/resources/query/OptionalQueryTemplate/match
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/crossRefValidation/validateCrossReferences
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function getAttributeValue(text: string, refOffset: number, attributeName: string): string | null`

# Calls

- [getContainingTag](../../../../../functions/server/src/features/crossRefValidation/getContainingTag.md)
- [escapeRegex](../../../../../functions/server/src/utils/textUtils/escapeRegex.md)
- [match](../../../../../functions/mcp/src/resources/query/OptionalQueryTemplate/match.md)

# Called by

- [validateCrossReferences](../../../../../functions/server/src/features/crossRefValidation/validateCrossReferences.md)