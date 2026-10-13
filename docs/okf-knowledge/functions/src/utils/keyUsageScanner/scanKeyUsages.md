---
type: TypeScript Function
title: scanKeyUsages
resource: src/utils/keyUsageScanner.ts#L44-L107
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/mapView/RowDrag/find
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/readFile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/parse/Scanner/startsWith
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/providers/keySpaceViewProvider/KeySpaceViewProvider/_buildTree
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function scanKeyUsages(): Promise<Map<string, KeyUsage[]>>`

# Calls

- [find](../../../../functions/webview/editor/mapView/RowDrag/find.md)
- [readFile](../../../../functions/webview/editor/readFile.md)
- [startsWith](../../../../functions/src/shared/cst/parse/Scanner/startsWith.md)

# Called by

- [_buildTree](../../../../functions/src/providers/keySpaceViewProvider/KeySpaceViewProvider/_buildTree.md)