---
type: TypeScript Function
title: stateAt
resource: src/test/shared/editorMenu.test.ts#L45-L50
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/editor/toProseMirror/buildDocument
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/test/shared/editorMenu/test/apply
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function stateAt(source: string, text: string, select = false): { state: EditorState; base: ReturnType<typeof buildDocument>['base'] }`

# Calls

- [buildDocument](../../../../../../functions/src/shared/editor/toProseMirror/buildDocument.md)

# Called by

- [apply](../../../../../../functions/src/test/shared/editorMenu/test/apply.md)