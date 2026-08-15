---
type: TypeScript Module
title: fileCreationCommands
resource: src/commands/fileCreationCommands.ts#L1-L859
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
  - target: external/fs-promises
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-logger
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-templateengine
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-xmlutils
    resolved_by: tree-sitter
    confidence: exact
  - target: external/utils-pathutils
    resolved_by: tree-sitter
    confidence: exact
  member_of:
  - target: packages/ditacraft
    resolved_by: tree-sitter
    confidence: exact
---

# Contains

- [FileCreationOptions](../../../interfaces/src/commands/fileCreationCommands/FileCreationOptions.md)
- [validateFileName](../../../functions/src/commands/fileCreationCommands/validateFileName.md)
- [getWorkspaceFolder](../../../functions/src/commands/fileCreationCommands/getWorkspaceFolder.md)
- [TemplateContext](../../../interfaces/src/commands/fileCreationCommands/TemplateContext.md)
- [getTemplateContext](../../../functions/src/commands/fileCreationCommands/getTemplateContext.md)
- [todayIso](../../../functions/src/commands/fileCreationCommands/todayIso.md)
- [humanizeFileName](../../../functions/src/commands/fileCreationCommands/humanizeFileName.md)
- [createDitaFile](../../../functions/src/commands/fileCreationCommands/createDitaFile.md)
- [promptForFileName](../../../functions/src/commands/fileCreationCommands/promptForFileName.md)
- [resolveTemplatedOrGeneratedContent](../../../functions/src/commands/fileCreationCommands/resolveTemplatedOrGeneratedContent.md)
- [resolveTemplatedOrGeneratedContentWithTitle](../../../functions/src/commands/fileCreationCommands/resolveTemplatedOrGeneratedContentWithTitle.md)
- [newTopicCommand](../../../functions/src/commands/fileCreationCommands/newTopicCommand.md)
- [newMapCommand](../../../functions/src/commands/fileCreationCommands/newMapCommand.md)
- [newBookmapCommand](../../../functions/src/commands/fileCreationCommands/newBookmapCommand.md)
- [initProjectCommand](../../../functions/src/commands/fileCreationCommands/initProjectCommand.md)
- [ProjectInitOptions](../../../interfaces/src/commands/fileCreationCommands/ProjectInitOptions.md)
- [runProjectInit](../../../functions/src/commands/fileCreationCommands/runProjectInit.md)
- [findExistingPaths](../../../functions/src/commands/fileCreationCommands/findExistingPaths.md)
- [findNonDirectoryConflicts](../../../functions/src/commands/fileCreationCommands/findNonDirectoryConflicts.md)
- [generateInitMapContent](../../../functions/src/commands/fileCreationCommands/generateInitMapContent.md)
- [generateInitBookmapContent](../../../functions/src/commands/fileCreationCommands/generateInitBookmapContent.md)
- [generateStarterDitavalContent](../../../functions/src/commands/fileCreationCommands/generateStarterDitavalContent.md)
- [generateTopicContent](../../../functions/src/commands/fileCreationCommands/generateTopicContent.md)
- [generateMapContent](../../../functions/src/commands/fileCreationCommands/generateMapContent.md)
- [generateBookmapContent](../../../functions/src/commands/fileCreationCommands/generateBookmapContent.md)

# Imports

- `vscode`
- `path`
- `fs/promises`
- `../utils/logger`
- `../utils/templateEngine`
- `../utils/xmlUtils`
- `../utils/pathUtils`

# Member of

- [ditacraft](../../../packages/ditacraft.md)