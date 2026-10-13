---
type: TypeScript Module
title: findReplaceCommand
resource: src/commands/findReplaceCommand.ts#L1-L260
generated:
  by: okf-rs/0.7.0
relationships:
  imports:
  - target: external/vscode
    resolved_by: tree-sitter
    confidence: exact
  - target: external/languageclient
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-logger
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-constants
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [LspTextEdit](../../../interfaces/src/commands/findReplaceCommand/LspTextEdit.md)
- [LspWorkspaceEdit](../../../interfaces/src/commands/findReplaceCommand/LspWorkspaceEdit.md)
- [FindReplaceResponse](../../../interfaces/src/commands/findReplaceCommand/FindReplaceResponse.md)
- [findReplaceInFilesCommand](../../../functions/src/commands/findReplaceCommand/findReplaceInFilesCommand.md)
- [confirmWorkspaceEdit](../../../functions/src/commands/findReplaceCommand/confirmWorkspaceEdit.md)
- [describeFileChanges](../../../functions/src/commands/findReplaceCommand/describeFileChanges.md)
- [parseFindOptions](../../../functions/src/commands/findReplaceCommand/parseFindOptions.md)
- [validateRegexQuery](../../../functions/src/commands/findReplaceCommand/validateRegexQuery.md)
- [describeSearchLabel](../../../functions/src/commands/findReplaceCommand/describeSearchLabel.md)
- [buildWorkspaceEdit](../../../functions/src/commands/findReplaceCommand/buildWorkspaceEdit.md)

# Imports

- `vscode`
- `../languageClient`
- `../utils/logger`
- `../utils/constants`

# Member of

- [ditacraft](../../../packages/ditacraft.md)