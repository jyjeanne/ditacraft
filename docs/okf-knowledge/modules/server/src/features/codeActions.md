---
type: TypeScript Module
title: codeActions
resource: server/src/features/codeActions.ts#L1-L609
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
  - target: external/data-ditaspecialization
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/server
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [handleCodeActions](../../../../functions/server/src/features/codeActions/handleCodeActions.md)
- [getFixesForDiagnostic](../../../../functions/server/src/features/codeActions/getFixesForDiagnostic.md)
- [fixMissingDoctype](../../../../functions/server/src/features/codeActions/fixMissingDoctype.md)
- [fixMissingId](../../../../functions/server/src/features/codeActions/fixMissingId.md)
- [fixMissingTitle](../../../../functions/server/src/features/codeActions/fixMissingTitle.md)
- [fixEmptyElement](../../../../functions/server/src/features/codeActions/fixEmptyElement.md)
- [fixDuplicateId](../../../../functions/server/src/features/codeActions/fixDuplicateId.md)
- [fixMissingOtherrole](../../../../functions/server/src/features/codeActions/fixMissingOtherrole.md)
- [fixDeprecatedIndextermref](../../../../functions/server/src/features/codeActions/fixDeprecatedIndextermref.md)
- [fixDeprecatedAltAttr](../../../../functions/server/src/features/codeActions/fixDeprecatedAltAttr.md)
- [fixMissingAlt](../../../../functions/server/src/features/codeActions/fixMissingAlt.md)
- [fixInvalidIdFormat](../../../../functions/server/src/features/codeActions/fixInvalidIdFormat.md)
- [fixMissingBooktitle](../../../../functions/server/src/features/codeActions/fixMissingBooktitle.md)
- [fixMissingMainbooktitle](../../../../functions/server/src/features/codeActions/fixMissingMainbooktitle.md)

# Imports

- `vscode-languageserver/node`
- `vscode-languageserver-textdocument`
- `../data/ditaSpecialization`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)