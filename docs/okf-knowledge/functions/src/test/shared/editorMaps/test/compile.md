---
type: TypeScript Function
title: compile
resource: src/test/shared/editorMaps.test.ts#L45-L48
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/grammar/typesxmlAdapter/readDtdGrammar
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/schema/buildEditorSchema
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function compile(shell: string, id: string): EditorSchema`

# Calls

- [readDtdGrammar](../../../../../../functions/src/shared/grammar/typesxmlAdapter/readDtdGrammar.md)
- [buildEditorSchema](../../../../../../functions/src/shared/editor/schema/buildEditorSchema.md)