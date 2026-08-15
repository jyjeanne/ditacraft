---
type: TypeScript Function
title: createDocs
resource: server/test/helper.ts#L22-L30
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/test/codeActions/test/actions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/completion/test/complete
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
  - target: functions/server/test/symbols/test/wsSymbols
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function createDocs( ...docs: TextDocument[] ): TextDocuments<TextDocument>`

# Calls

- [get](../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)

# Called by

- [actions](../../../../functions/server/test/codeActions/test/actions.md)
- [complete](../../../../functions/server/test/completion/test/complete.md)
- [createDocsFromContent](../../../../functions/server/test/helper/createDocsFromContent.md)
- [hover](../../../../functions/server/test/hover/test/hover.md)
- [linked](../../../../functions/server/test/linkedEditing/test/linked.md)
- [symbols](../../../../functions/server/test/symbols/test/symbols.md)
- [wsSymbols](../../../../functions/server/test/symbols/test/wsSymbols.md)