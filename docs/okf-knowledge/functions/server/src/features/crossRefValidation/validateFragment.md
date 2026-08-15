---
type: TypeScript Function
title: validateFragment
resource: server/src/features/crossRefValidation.ts#L321-L365
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/escapeRegex
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/i18n/t
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function validateFragment( fragment: string, content: string, range: Range, fileName: string, diagnostics: Diagnostic[] ): boolean`

# Calls

- [escapeRegex](../../../../../functions/server/src/utils/textUtils/escapeRegex.md)
- [t](../../../../../functions/server/src/utils/i18n/t.md)