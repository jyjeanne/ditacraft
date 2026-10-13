---
type: TypeScript Function
title: load
resource: src/test/shared/editor.test.ts#L30-L34
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/html/internalSubsetEntities
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/doctypeInternalSubset
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/buildDocument
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function load(source: string): BuildResult`

# Calls

- [internalSubsetEntities](../../../../../../functions/src/shared/render/html/internalSubsetEntities.md)
- [doctypeInternalSubset](../../../../../../functions/src/shared/cst/query/doctypeInternalSubset.md)
- [buildDocument](../../../../../../functions/src/shared/editor/toProseMirror/buildDocument.md)