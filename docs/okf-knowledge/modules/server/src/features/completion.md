---
type: TypeScript Module
title: completion
resource: server/src/features/completion.ts#L1-L702
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
  - target: external/fs-promises
    resolved_by: tree-sitter
    confidence: exact
  - target: external/fs
    resolved_by: tree-sitter
    confidence: exact
  - target: external/data-ditaschema
    resolved_by: tree-sitter
    confidence: exact
  - target: external/services-keyspaceservice
    resolved_by: tree-sitter
    confidence: exact
  - target: external/services-subjectschemeservice
    resolved_by: tree-sitter
    confidence: exact
  - target: external/data-ditaspecialization
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-textutils
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-tagstack
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/server
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [CompletionContext](../../../../interfaces/server/src/features/completion/CompletionContext.md)
- [DetectedContext](../../../../interfaces/server/src/features/completion/DetectedContext.md)
- [handleCompletion](../../../../functions/server/src/features/completion/handleCompletion.md)
- [detectContext](../../../../functions/server/src/features/completion/detectContext.md)
- [findParentElement](../../../../functions/server/src/features/completion/findParentElement.md)
- [findAttributeValueContext](../../../../functions/server/src/features/completion/findAttributeValueContext.md)
- [findAttributeContext](../../../../functions/server/src/features/completion/findAttributeContext.md)
- [findCurrentElement](../../../../functions/server/src/features/completion/findCurrentElement.md)
- [getElementCompletions](../../../../functions/server/src/features/completion/getElementCompletions.md)
- [getAttributeCompletions](../../../../functions/server/src/features/completion/getAttributeCompletions.md)
- [getAttributeValueCompletions](../../../../functions/server/src/features/completion/getAttributeValueCompletions.md)
- [getKeyrefCompletions](../../../../functions/server/src/features/completion/getKeyrefCompletions.md)
- [getHrefFragmentCompletions](../../../../functions/server/src/features/completion/getHrefFragmentCompletions.md)
- [getHrefFileCompletions](../../../../functions/server/src/features/completion/getHrefFileCompletions.md)
- [extractTopicIds](../../../../functions/server/src/features/completion/extractTopicIds.md)
- [extractAllIds](../../../../functions/server/src/features/completion/extractAllIds.md)
- [extractElementIdsInTopic](../../../../functions/server/src/features/completion/extractElementIdsInTopic.md)

# Imports

- `vscode-languageserver/node`
- `vscode-languageserver-textdocument`
- `path`
- `fs/promises`
- `fs`
- `../data/ditaSchema`
- `../services/keySpaceService`
- `../services/subjectSchemeService`
- `../data/ditaSpecialization`
- `../utils/textUtils`
- `../utils/tagStack`

# Member of

- [ditacraft-lsp-server](../../../../packages/server.md)