---
type: TypeScript Module
title: batchMetadataCommand
resource: src/commands/batchMetadataCommand.ts#L1-L159
generated:
  by: okf-rs/0.4.0
relationships:
  imports:
  - target: external/vscode
    resolved_by: tree-sitter
    confidence: exact
  - target: external/path
    resolved_by: tree-sitter
    confidence: exact
  - target: external/languageclient
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-logger
    resolved_by: tree-sitter
    confidence: exact
  - target: external/providers-ditaexplorerprovider
    resolved_by: tree-sitter
    confidence: exact
  - target: external/findreplacecommand
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [BatchMetadataSkippedFile](../../../interfaces/src/commands/batchMetadataCommand/BatchMetadataSkippedFile.md)
- [BatchMetadataResponse](../../../interfaces/src/commands/batchMetadataCommand/BatchMetadataResponse.md)
- [batchUpdateMetadataCommand](../../../functions/src/commands/batchMetadataCommand/batchUpdateMetadataCommand.md)
- [resolveSelectedFileItems](../../../functions/src/commands/batchMetadataCommand/resolveSelectedFileItems.md)
- [describeBatchLabel](../../../functions/src/commands/batchMetadataCommand/describeBatchLabel.md)
- [summarizeSkipped](../../../functions/src/commands/batchMetadataCommand/summarizeSkipped.md)
- [promptForAttribute](../../../functions/src/commands/batchMetadataCommand/promptForAttribute.md)

# Imports

- `vscode`
- `path`
- `../languageClient`
- `../utils/logger`
- `../providers/ditaExplorerProvider`
- `./findReplaceCommand`

# Member of

- [ditacraft](../../../packages/ditacraft.md)