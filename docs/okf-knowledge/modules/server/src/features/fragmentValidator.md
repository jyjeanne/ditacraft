---
type: TypeScript Module
title: fragmentValidator
resource: server/src/features/fragmentValidator.ts#L1-L110
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/vscode-languageserver-textdocument
    resolved_by: tree-sitter
    confidence: exact
  - target: external/vscode-languageserver-node
    resolved_by: tree-sitter
    confidence: exact
  - target: external/services-validationpipeline
    resolved_by: tree-sitter
    confidence: exact
  - target: external/settings
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/server
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [ValidateFragmentParams](../../../../interfaces/server/src/features/fragmentValidator/ValidateFragmentParams.md)
- [FragmentValidationResult](../../../../interfaces/server/src/features/fragmentValidator/FragmentValidationResult.md)
- [wrapFragment](../../../../functions/server/src/features/fragmentValidator/wrapFragment.md)
- [handleValidateFragment](../../../../functions/server/src/features/fragmentValidator/handleValidateFragment.md)

# Imports

- `vscode-languageserver-textdocument`
- `vscode-languageserver/node`
- `../services/validationPipeline`
- `../settings`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)