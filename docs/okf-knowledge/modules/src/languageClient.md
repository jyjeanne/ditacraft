---
type: TypeScript Module
title: languageClient
resource: src/languageClient.ts#L1-L103
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/vscode
    resolved_by: tree-sitter
    confidence: exact
  - target: external/vscode-languageclient-node
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-logger
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [startLanguageClient](../../functions/src/languageClient/startLanguageClient.md)
- [getLanguageClient](../../functions/src/languageClient/getLanguageClient.md)
- [waitForLanguageClientReady](../../functions/src/languageClient/waitForLanguageClientReady.md)
- [stopLanguageClient](../../functions/src/languageClient/stopLanguageClient.md)

# Imports

- `path`
- `vscode`
- `vscode-languageclient/node`
- `./utils/logger`

# Member of

- [ditacraft](../../packages/ditacraft.md)