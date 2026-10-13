---
type: TypeScript Method
title: sendInit
resource: src/editor/visualEditorProvider.ts#L523-L552
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/sharedRegistry/sharedGrammarRegistry
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarRegistry/GrammarRegistry/select
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/grammarOptions/grammarSelectOptions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/grammarKeyOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/basename
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/handle
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/onDocumentChange
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private sendInit(): void`

# Calls

- [sharedGrammarRegistry](../../../../../functions/src/preview/sharedRegistry/sharedGrammarRegistry.md)
- [select](../../../../../functions/src/preview/grammarRegistry/GrammarRegistry/select.md)
- [grammarSelectOptions](../../../../../functions/src/preview/grammarOptions/grammarSelectOptions.md)
- [grammarKeyOf](../../../../../functions/src/editor/visualEditorProvider/EditorSession/grammarKeyOf.md)
- [basename](../../../../../functions/src/shared/render/toHtml/basename.md)

# Called by

- [handle](../../../../../functions/src/editor/visualEditorProvider/EditorSession/handle.md)
- [onDocumentChange](../../../../../functions/src/editor/visualEditorProvider/EditorSession/onDocumentChange.md)