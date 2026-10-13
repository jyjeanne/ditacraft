---
type: TypeScript Function
title: isDirectory
resource: server/src/features/moveTopic.ts#L139-L145
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/mcp/src/resources/maps/readMapsResource
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/mcp/src/utils/mapDiscovery/discoverRootMap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/completion/getHrefFileCompletions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/moveTopic/handleComputeMoveEdits
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/workspaceScanner/walk
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/test/docsDataset/test/collectDitaFiles
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/findNonDirectoryConflicts
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/linkPicker/candidateFiles
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/localMaps
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/buildGrammars/listFiles
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/test/shared/helpers/listFiles
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/publish
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/ditaOtWrapper/DitaOtWrapper/validateInputFile
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function isDirectory(filePath: string): Promise<boolean>`

# Called by

- [readMapsResource](../../../../../functions/mcp/src/resources/maps/readMapsResource.md)
- [discoverRootMap](../../../../../functions/mcp/src/utils/mapDiscovery/discoverRootMap.md)
- [getHrefFileCompletions](../../../../../functions/server/src/features/completion/getHrefFileCompletions.md)
- [handleComputeMoveEdits](../../../../../functions/server/src/features/moveTopic/handleComputeMoveEdits.md)
- [walk](../../../../../functions/server/src/utils/workspaceScanner/walk.md)
- [collectDitaFiles](../../../../../functions/server/test/docsDataset/test/collectDitaFiles.md)
- [findNonDirectoryConflicts](../../../../../functions/src/commands/fileCreationCommands/findNonDirectoryConflicts.md)
- [candidateFiles](../../../../../functions/src/editor/linkPicker/candidateFiles.md)
- [localMaps](../../../../../functions/src/preview/mapContexts/localMaps.md)
- [listFiles](../../../../../functions/src/shared/grammar/buildGrammars/listFiles.md)
- [listFiles](../../../../../functions/src/test/shared/helpers/listFiles.md)
- [publish](../../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/publish.md)
- [validateInputFile](../../../../../functions/src/utils/ditaOtWrapper/DitaOtWrapper/validateInputFile.md)