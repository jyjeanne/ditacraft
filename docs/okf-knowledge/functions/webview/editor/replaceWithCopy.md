---
type: TypeScript Function
title: replaceWithCopy
resource: webview/editor/main.ts#L1785-L1827
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/editable
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/noteReuse
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/html/internalSubsetEntities
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/doctypeInternalSubset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/buildFragment
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/labels/format
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/webview/editor/reuseResult
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function replaceWithCopy(node: PMNode, xml: string): void`

# Calls

- [editable](../../../functions/webview/editor/editable.md)
- [noteReuse](../../../functions/webview/editor/noteReuse.md)
- [internalSubsetEntities](../../../functions/src/shared/render/html/internalSubsetEntities.md)
- [doctypeInternalSubset](../../../functions/src/shared/cst/query/doctypeInternalSubset.md)
- [buildFragment](../../../functions/src/shared/editor/toProseMirror/buildFragment.md)
- [format](../../../functions/src/shared/render/labels/format.md)

# Called by

- [reuseResult](../../../functions/webview/editor/reuseResult.md)