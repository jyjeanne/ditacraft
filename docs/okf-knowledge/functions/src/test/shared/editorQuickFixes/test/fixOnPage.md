---
type: TypeScript Function
title: fixOnPage
resource: src/test/shared/editorQuickFixes.test.ts#L50-L60
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/webview/editor/build
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/sourceChange/sourceChangeTransaction
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toSource/serializeDocument
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function fixOnPage(text: string, edits: TextEdit[], state?: EditorState, base?: Base): { written: string; state: EditorState; base: Base } | undefined`

# Calls

- [build](../../../../../../functions/webview/editor/build.md)
- [sourceChangeTransaction](../../../../../../functions/src/shared/editor/sourceChange/sourceChangeTransaction.md)
- [serializeDocument](../../../../../../functions/src/shared/editor/toSource/serializeDocument.md)