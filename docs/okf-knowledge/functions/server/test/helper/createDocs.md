---
type: TypeScript Function
title: createDocs
resource: server/test/helper.ts#L22-L30
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/server/test/codeActions/test/actions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/completion/test/complete
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/findReplace/test/matched
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/helper/createDocsFromContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/hover/test/hover
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/inlineConref/test/inline
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/linkedEditing/test/linked
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/moveTopic/test/moveFiles
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/rename/test/project
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

# Called by

- [actions](../../../../functions/server/test/codeActions/test/actions.md)
- [complete](../../../../functions/server/test/completion/test/complete.md)
- [matched](../../../../functions/server/test/findReplace/test/matched.md)
- [createDocsFromContent](../../../../functions/server/test/helper/createDocsFromContent.md)
- [hover](../../../../functions/server/test/hover/test/hover.md)
- [inline](../../../../functions/server/test/inlineConref/test/inline.md)
- [linked](../../../../functions/server/test/linkedEditing/test/linked.md)
- [moveFiles](../../../../functions/server/test/moveTopic/test/moveFiles.md)
- [project](../../../../functions/server/test/rename/test/project.md)
- [symbols](../../../../functions/server/test/symbols/test/symbols.md)
- [wsSymbols](../../../../functions/server/test/symbols/test/wsSymbols.md)