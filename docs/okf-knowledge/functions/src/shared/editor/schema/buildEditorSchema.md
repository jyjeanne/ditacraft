---
type: TypeScript Function
title: buildEditorSchema
resource: src/shared/editor/schema.ts#L160-L322
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/render/labels/labelsFor
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/entries
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/pmNames/pmBlockName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/pmNames/pmName
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/grammar/classTokens/classTokens
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/schema/kindOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/schema/markDom
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/schema/opaqueDom
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/schema/elementDom
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/toProseMirror/Builder/block
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/schema/groupExpression
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/schema/unknownDom
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/editor/schema/childSetOf
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/test/shared/editorMaps/test/compile
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/webview/editor/start
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function buildEditorSchema(grammar: Grammar, options: { labels?: Labels } = {}): EditorSchema`

# Calls

- [labelsFor](../../../../../functions/src/shared/render/labels/labelsFor.md)
- [entries](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/entries.md)
- [pmBlockName](../../../../../functions/src/shared/grammar/pmNames/pmBlockName.md)
- [pmName](../../../../../functions/src/shared/grammar/pmNames/pmName.md)
- [classTokens](../../../../../functions/src/shared/grammar/classTokens/classTokens.md)
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)
- [kindOf](../../../../../functions/src/shared/editor/schema/kindOf.md)
- [markDom](../../../../../functions/src/shared/editor/schema/markDom.md)
- [opaqueDom](../../../../../functions/src/shared/editor/schema/opaqueDom.md)
- [elementDom](../../../../../functions/src/shared/editor/schema/elementDom.md)
- [block](../../../../../functions/src/shared/editor/toProseMirror/Builder/block.md)
- [groupExpression](../../../../../functions/src/shared/editor/schema/groupExpression.md)
- [unknownDom](../../../../../functions/src/shared/editor/schema/unknownDom.md)
- [childSetOf](../../../../../functions/src/shared/editor/schema/childSetOf.md)

# Called by

- [compile](../../../../../functions/src/test/shared/editorMaps/test/compile.md)
- [start](../../../../../functions/webview/editor/start.md)