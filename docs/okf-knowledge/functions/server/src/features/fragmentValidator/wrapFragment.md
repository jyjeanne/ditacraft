---
type: TypeScript Function
title: wrapFragment
resource: server/src/features/fragmentValidator.ts#L33-L54
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/fragmentValidator/handleValidateFragment
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function wrapFragment(fragment: string, fragmentType: ValidateFragmentParams['fragmentType']): string`

# Calls

- [startsWith](../../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [handleValidateFragment](../../../../../functions/server/src/features/fragmentValidator/handleValidateFragment.md)