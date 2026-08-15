---
type: TypeScript Function
title: validate
resource: server/test/validation.test.ts#L30-L33
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/test/helper/createDoc
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/validation/validateDITADocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/validation/test/defaultSettings
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function validate(content: string, uri = 'file:///test.dita')`

# Calls

- [createDoc](../../../../../functions/server/test/helper/createDoc.md)
- [validateDITADocument](../../../../../functions/server/src/features/validation/validateDITADocument.md)
- [defaultSettings](../../../../../functions/server/test/validation/test/defaultSettings.md)