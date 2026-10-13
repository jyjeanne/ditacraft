---
type: TypeScript Method
title: grammarKeyOf
resource: src/editor/visualEditorProvider.ts#L514-L521
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/shared/cst/query/doctypePublicId
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/rootElement
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/sendInit
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/editor/visualEditorProvider/EditorSession/onDocumentChange
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private grammarKeyOf(text: string): string | undefined`

# Calls

- [doctypePublicId](../../../../../functions/src/shared/cst/query/doctypePublicId.md)
- [rootElement](../../../../../functions/src/shared/cst/query/rootElement.md)

# Called by

- [sendInit](../../../../../functions/src/editor/visualEditorProvider/EditorSession/sendInit.md)
- [onDocumentChange](../../../../../functions/src/editor/visualEditorProvider/EditorSession/onDocumentChange.md)