---
type: TypeScript Function
title: onRow
resource: src/test/shared/editorMaps.test.ts#L101-L110
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toProseMirror/buildDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/pick
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/serializeDocument
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function onRow(source: string, pick: (doc: PMNode) => number, command: Command, es = mapEs): { out: string; state: EditorState }`

# Calls

- [buildDocument](../../../../../../functions/src/shared/editor/toProseMirror/buildDocument.md)
- [pick](../../../../../../functions/src/preview/mapContexts/MapContexts/pick.md)
- [serializeDocument](../../../../../../functions/src/shared/editor/toSource/serializeDocument.md)