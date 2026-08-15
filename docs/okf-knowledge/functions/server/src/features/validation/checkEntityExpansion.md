---
type: TypeScript Function
title: checkEntityExpansion
resource: server/src/features/validation.ts#L130-L200
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/validation/hasNonPredefinedEntityRef
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/entityRange
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/i18n/t
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/validation/validateDITADocument
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function checkEntityExpansion( text: string, textDocument: TextDocument, diagnostics: Diagnostic[] ): void`

# Calls

- [hasNonPredefinedEntityRef](../../../../../functions/server/src/features/validation/hasNonPredefinedEntityRef.md)
- [entityRange](../../../../../functions/server/src/features/validation/entityRange.md)
- [t](../../../../../functions/server/src/utils/i18n/t.md)

# Called by

- [validateDITADocument](../../../../../functions/server/src/features/validation/validateDITADocument.md)