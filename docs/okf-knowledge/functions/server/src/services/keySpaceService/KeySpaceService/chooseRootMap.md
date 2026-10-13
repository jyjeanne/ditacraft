---
type: TypeScript Method
title: chooseRootMap
resource: server/src/services/keySpaceService.ts#L664-L696
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/utils/textUtils/normalizeFsPath
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async chooseRootMap(absolutePath: string, fileKey: string): Promise<string | null>`

# Calls

- [has](../../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [normalizeFsPath](../../../../../../functions/server/src/utils/textUtils/normalizeFsPath.md)
- [find](../../../../../../functions/webview/editor/mapView/RowDrag/find.md)