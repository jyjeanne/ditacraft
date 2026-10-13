---
type: TypeScript Function
title: dfsDetectAnyCycle
resource: server/src/features/circularRefDetection.ts#L172-L226
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/features/circularRefDetection/normalizePath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/readFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/circularRefDetection/extractFileReferences
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/circularRefDetection/detectCircularReferences
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function dfsDetectAnyCycle( currentFile: string, pathStack: Set<string>, pathList: string[], fileCache: Map<string, string | null>, workspaceFolders: readonly string[], ): Promise<string[] | null>`

# Calls

- [normalizePath](../../../../../functions/server/src/features/circularRefDetection/normalizePath.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [readFile](../../../../../functions/webview/editor/readFile.md)
- [extractFileReferences](../../../../../functions/server/src/features/circularRefDetection/extractFileReferences.md)

# Called by

- [detectCircularReferences](../../../../../functions/server/src/features/circularRefDetection/detectCircularReferences.md)