---
type: TypeScript Function
title: detectUnusedTopics
resource: server/src/features/workspaceValidation.ts#L121-L181
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/utils/workspaceScanner/collectDitaFilesAsync
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/workspaceValidation/mapWithConcurrency
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/readFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/normalizeFsPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function detectUnusedTopics( workspaceFolders: readonly string[], keySpaceService: KeySpaceService, preScannedFiles?: string[] ): Promise<Set<string>>`

# Calls

- [collectDitaFilesAsync](../../../../../functions/server/src/utils/workspaceScanner/collectDitaFilesAsync.md)
- [mapWithConcurrency](../../../../../functions/server/src/features/workspaceValidation/mapWithConcurrency.md)
- [readFile](../../../../../functions/webview/editor/readFile.md)
- [normalizeFsPath](../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)