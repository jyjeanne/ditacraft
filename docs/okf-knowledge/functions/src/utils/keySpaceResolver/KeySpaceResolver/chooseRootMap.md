---
type: TypeScript Method
title: chooseRootMap
resource: src/utils/keySpaceResolver.ts#L1465-L1494
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/keySpaceResolver/KeySpaceResolver/normalizePathForComparison
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async chooseRootMap(absolutePath: string, fileKey: string): Promise<string | null>`

# Calls

- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [normalizePathForComparison](../../../../../functions/src/utils/keySpaceResolver/KeySpaceResolver/normalizePathForComparison.md)
- [find](../../../../../functions/webview/editor/mapView/RowDrag/find.md)