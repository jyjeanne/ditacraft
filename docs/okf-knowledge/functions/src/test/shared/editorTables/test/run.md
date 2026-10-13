---
type: TypeScript Function
title: run
resource: src/test/shared/editorTables.test.ts#L76-L87
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toProseMirror/buildDocument
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/serializeDocument
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function run(source: string, cell: string, command: Command): Outcome`

# Calls

- [buildDocument](../../../../../../functions/src/shared/editor/toProseMirror/buildDocument.md)
- [serializeDocument](../../../../../../functions/src/shared/editor/toSource/serializeDocument.md)