---
type: TypeScript Method
title: readsFile
resource: src/editor/visualEditorProvider.ts#L278-L280
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/paths/samePath
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/constructor
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private readsFile(uri: vscode.Uri): boolean`

# Calls

- [samePath](../../../../../functions/src/preview/paths/samePath.md)

# Called by

- [constructor](../../../../../functions/src/editor/visualEditorProvider/EditorSession/constructor.md)