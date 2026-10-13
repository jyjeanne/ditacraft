---
type: TypeScript Function
title: rowsOf
resource: src/test/shared/editorMaps.test.ts#L88-L91
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toProseMirror/buildDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/maps/mapRows
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function rowsOf(source: string, es = mapEs): { doc: PMNode; rows: { pos: number; node: PMNode }[] }`

# Calls

- [buildDocument](../../../../../../functions/src/shared/editor/toProseMirror/buildDocument.md)
- [mapRows](../../../../../../functions/src/shared/editor/maps/mapRows.md)