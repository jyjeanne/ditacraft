---
type: TypeScript Function
title: extractDoctypeInternalSubset
resource: server/src/features/validation.ts#L153-L183
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/extractBracketedSubset
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/validation/checkEntityExpansion
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function extractDoctypeInternalSubset( text: string ): { subset: string; offset: number; doctypeOffset: number } | null`

# Calls

- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)
- [extractBracketedSubset](../../../../../functions/server/src/features/validation/extractBracketedSubset.md)

# Called by

- [checkEntityExpansion](../../../../../functions/server/src/features/validation/checkEntityExpansion.md)