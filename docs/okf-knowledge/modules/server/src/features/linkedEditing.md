---
type: TypeScript Module
title: linkedEditing
resource: server/src/features/linkedEditing.ts#L1-L240
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/vscode-languageserver-node
    resolved_by: tree-sitter
    confidence: exact
  - target: external/vscode-languageserver-textdocument
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/server
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [handleLinkedEditingRange](../../../../functions/server/src/features/linkedEditing/handleLinkedEditingRange.md)
- [TagAtOffset](../../../../interfaces/server/src/features/linkedEditing/TagAtOffset.md)
- [TagNameRange](../../../../interfaces/server/src/features/linkedEditing/TagNameRange.md)
- [findTagAtOffset](../../../../functions/server/src/features/linkedEditing/findTagAtOffset.md)
- [findClosingTag](../../../../functions/server/src/features/linkedEditing/findClosingTag.md)
- [findOpeningTag](../../../../functions/server/src/features/linkedEditing/findOpeningTag.md)
- [TagOccurrence](../../../../interfaces/server/src/features/linkedEditing/TagOccurrence.md)
- [escapeRegExp](../../../../functions/server/src/features/linkedEditing/escapeRegExp.md)

# Imports

- `vscode-languageserver/node`
- `vscode-languageserver-textdocument`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)