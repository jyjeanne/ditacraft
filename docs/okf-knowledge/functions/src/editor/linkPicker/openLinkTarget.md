---
type: TypeScript Function
title: openLinkTarget
resource: src/editor/linkPicker.ts#L254-L299
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/providers/ditaLinkProvider/getGlobalKeySpaceResolver
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/cst/query/rootElement
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/handle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function openLinkTarget(document: vscode.TextDocument, target: LinkTarget): Promise<string | undefined>`

# Calls

- [getGlobalKeySpaceResolver](../../../../functions/src/providers/ditaLinkProvider/getGlobalKeySpaceResolver.md)
- [rootElement](../../../../functions/src/shared/cst/query/rootElement.md)

# Called by

- [handle](../../../../functions/src/editor/visualEditorProvider/EditorSession/handle.md)