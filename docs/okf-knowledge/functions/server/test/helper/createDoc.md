---
type: TypeScript Function
title: createDoc
resource: server/test/helper.ts#L10-L16
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/test/codeActions/test/actions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/completion/test/complete
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/edgeCases/test/validate
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/helper/createDocsFromContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/hover/test/hover
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/linkedEditing/test/linked
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/symbols/test/symbols
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/validation/test/validate
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function createDoc( content: string, uri: string = TEST_URI, languageId: string = 'xml' ): TextDocument`

# Called by

- [actions](../../../../functions/server/test/codeActions/test/actions.md)
- [complete](../../../../functions/server/test/completion/test/complete.md)
- [validate](../../../../functions/server/test/edgeCases/test/validate.md)
- [createDocsFromContent](../../../../functions/server/test/helper/createDocsFromContent.md)
- [hover](../../../../functions/server/test/hover/test/hover.md)
- [linked](../../../../functions/server/test/linkedEditing/test/linked.md)
- [symbols](../../../../functions/server/test/symbols/test/symbols.md)
- [validate](../../../../functions/server/test/validation/test/validate.md)