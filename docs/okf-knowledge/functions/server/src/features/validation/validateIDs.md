---
type: TypeScript Function
title: validateIDs
resource: server/src/features/validation.ts#L661-L749
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/utils/textUtils/stripCommentsAndCodeContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/getEnclosingElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
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

`function validateIDs( text: string, textDocument: TextDocument, diagnostics: Diagnostic[] ): void`

# Calls

- [stripCommentsAndCodeContent](../../../../../functions/server/src/utils/textUtils/stripCommentsAndCodeContent.md)
- [getEnclosingElement](../../../../../functions/server/src/features/validation/getEnclosingElement.md)
- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [t](../../../../../functions/server/src/utils/i18n/t.md)

# Called by

- [validateDITADocument](../../../../../functions/server/src/features/validation/validateDITADocument.md)