---
type: TypeScript Function
title: checkEntityExpansion
resource: server/src/features/validation.ts#L226-L294
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/features/validation/extractDoctypeInternalSubset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/hasNonPredefinedEntityRef
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/entityRange
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

- [extractDoctypeInternalSubset](../../../../../functions/server/src/features/validation/extractDoctypeInternalSubset.md)
- [hasNonPredefinedEntityRef](../../../../../functions/server/src/features/validation/hasNonPredefinedEntityRef.md)
- [entityRange](../../../../../functions/server/src/features/validation/entityRange.md)

# Called by

- [validateDITADocument](../../../../../functions/server/src/features/validation/validateDITADocument.md)