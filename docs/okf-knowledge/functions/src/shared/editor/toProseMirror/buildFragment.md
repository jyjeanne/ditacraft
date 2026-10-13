---
type: TypeScript Function
title: buildFragment
resource: src/shared/editor/toProseMirror.ts#L596-L602
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/query/rootElement
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/detachNode
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/test/shared/editorReuse/test/replaced
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/replaceWithCopy
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function buildFragment(xml: string, es: EditorSchema, context: 'block' | 'inline', options: { entity?: EntityLookup; preserve?: boolean } = {}): PMNode[]`

# Calls

- [rootElement](../../../../../functions/src/shared/cst/query/rootElement.md)
- [detachNode](../../../../../functions/src/shared/editor/toProseMirror/detachNode.md)

# Called by

- [replaced](../../../../../functions/src/test/shared/editorReuse/test/replaced.md)
- [replaceWithCopy](../../../../../functions/webview/editor/replaceWithCopy.md)