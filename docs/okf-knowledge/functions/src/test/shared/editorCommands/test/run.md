---
type: TypeScript Function
title: run
resource: src/test/shared/editorCommands.test.ts#L41-L55
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

`function run(source: string, cursor: (doc: PMNode) => number, command: Command, expectApplied = true): string`

# Calls

- [buildDocument](../../../../../../functions/src/shared/editor/toProseMirror/buildDocument.md)
- [serializeDocument](../../../../../../functions/src/shared/editor/toSource/serializeDocument.md)