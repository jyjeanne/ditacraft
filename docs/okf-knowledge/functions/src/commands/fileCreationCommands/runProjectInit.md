---
type: TypeScript Function
title: runProjectInit
resource: src/commands/fileCreationCommands.ts#L506-L604
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/commands/fileCreationCommands/findExistingPaths
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/findNonDirectoryConflicts
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/getTemplateContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/todayIso
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/templateEngine/loadTemplateRaw
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/templateEngine/substitutePlaceholders
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/humanizeFileName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/generateTopicContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/generateInitBookmapContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/generateInitMapContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/generateStarterDitavalContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/info
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/fileCreationCommands/initProjectCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function runProjectInit(workspaceFolder: vscode.WorkspaceFolder, options: ProjectInitOptions): Promise<void>`

# Calls

- [findExistingPaths](../../../../functions/src/commands/fileCreationCommands/findExistingPaths.md)
- [findNonDirectoryConflicts](../../../../functions/src/commands/fileCreationCommands/findNonDirectoryConflicts.md)
- [getTemplateContext](../../../../functions/src/commands/fileCreationCommands/getTemplateContext.md)
- [todayIso](../../../../functions/src/commands/fileCreationCommands/todayIso.md)
- [loadTemplateRaw](../../../../functions/src/utils/templateEngine/loadTemplateRaw.md)
- [substitutePlaceholders](../../../../functions/src/utils/templateEngine/substitutePlaceholders.md)
- [humanizeFileName](../../../../functions/src/commands/fileCreationCommands/humanizeFileName.md)
- [generateTopicContent](../../../../functions/src/commands/fileCreationCommands/generateTopicContent.md)
- [generateInitBookmapContent](../../../../functions/src/commands/fileCreationCommands/generateInitBookmapContent.md)
- [generateInitMapContent](../../../../functions/src/commands/fileCreationCommands/generateInitMapContent.md)
- [generateStarterDitavalContent](../../../../functions/src/commands/fileCreationCommands/generateStarterDitavalContent.md)
- [info](../../../../functions/src/utils/logger/Logger/info.md)

# Called by

- [initProjectCommand](../../../../functions/src/commands/fileCreationCommands/initProjectCommand.md)