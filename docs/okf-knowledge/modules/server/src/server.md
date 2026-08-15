---
type: TypeScript Module
title: server
resource: server/src/server.ts#L1-L549
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
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/fs
    resolved_by: tree-sitter
    confidence: exact
  - target: external/settings
    resolved_by: tree-sitter
    confidence: exact
  - target: external/features-completion
    resolved_by: tree-sitter
    confidence: exact
  - target: external/features-hover
    resolved_by: tree-sitter
    confidence: exact
  - target: external/features-symbols
    resolved_by: tree-sitter
    confidence: exact
  - target: external/features-definition
    resolved_by: tree-sitter
    confidence: exact
  - target: external/features-references
    resolved_by: tree-sitter
    confidence: exact
  - target: external/features-formatting
    resolved_by: tree-sitter
    confidence: exact
  - target: external/features-codeactions
    resolved_by: tree-sitter
    confidence: exact
  - target: external/features-rename
    resolved_by: tree-sitter
    confidence: exact
  - target: external/features-folding
    resolved_by: tree-sitter
    confidence: exact
  - target: external/features-documentlinks
    resolved_by: tree-sitter
    confidence: exact
  - target: external/features-linkedediting
    resolved_by: tree-sitter
    confidence: exact
  - target: external/features-contextgraph
    resolved_by: tree-sitter
    confidence: exact
  - target: external/features-fragmentvalidator
    resolved_by: tree-sitter
    confidence: exact
  - target: external/features-contextsnapshot
    resolved_by: tree-sitter
    confidence: exact
  - target: external/features-movetopic
    resolved_by: tree-sitter
    confidence: exact
  - target: external/features-findreplace
    resolved_by: tree-sitter
    confidence: exact
  - target: external/features-batchmetadata
    resolved_by: tree-sitter
    confidence: exact
  - target: external/features-ditavalconditions
    resolved_by: tree-sitter
    confidence: exact
  - target: external/features-inlineconref
    resolved_by: tree-sitter
    confidence: exact
  - target: external/services-keyspaceservice
    resolved_by: tree-sitter
    confidence: exact
  - target: external/services-subjectschemeservice
    resolved_by: tree-sitter
    confidence: exact
  - target: external/features-workspacevalidation
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-workspacescanner
    resolved_by: tree-sitter
    confidence: exact
  - target: external/services-catalogvalidationservice
    resolved_by: tree-sitter
    confidence: exact
  - target: external/services-rngvalidationservice
    resolved_by: tree-sitter
    confidence: exact
  - target: external/services-validationpipeline
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-i18n
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-textutils
    resolved_by: tree-sitter
    confidence: exact
  - target: external/serverhandlers
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/server
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [ValidateFileResult](../../../interfaces/server/src/server/ValidateFileResult.md)
- [debouncedRefresh](../../../functions/server/src/server/debouncedRefresh.md)

# Imports

- `vscode-languageserver/node`
- `vscode-languageserver-textdocument`
- `path`
- `fs`
- `./settings`
- `./features/completion`
- `./features/hover`
- `./features/symbols`
- `./features/definition`
- `./features/references`
- `./features/formatting`
- `./features/codeActions`
- `./features/rename`
- `./features/folding`
- `./features/documentLinks`
- `./features/linkedEditing`
- `./features/contextGraph`
- `./features/fragmentValidator`
- `./features/contextSnapshot`
- `./features/moveTopic`
- `./features/findReplace`
- `./features/batchMetadata`
- `./features/ditavalConditions`
- `./features/inlineConref`
- `./services/keySpaceService`
- `./services/subjectSchemeService`
- `./features/workspaceValidation`
- `./utils/workspaceScanner`
- `./services/catalogValidationService`
- `./services/rngValidationService`
- `./services/validationPipeline`
- `./utils/i18n`
- `./utils/textUtils`
- `./serverHandlers`

# Member of

- [ditacraft-lsp-server](../../../packages/server.md)