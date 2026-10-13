---
type: TypeScript Method
title: contextFromRow
resource: src/editor/visualEditorProvider.ts#L889-L905
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/editor/visualEditorProvider/EditorSession/isMap
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/providers/ditaLinkProvider/getGlobalKeySpaceResolver
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/chooseFromMapRow
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/handle
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`private async contextFromRow(target: LinkTarget, from: number): Promise<void>`

# Calls

- [isMap](../../../../../functions/src/editor/visualEditorProvider/EditorSession/isMap.md)
- [getGlobalKeySpaceResolver](../../../../../functions/src/providers/ditaLinkProvider/getGlobalKeySpaceResolver.md)
- [chooseFromMapRow](../../../../../functions/src/preview/mapContexts/MapContexts/chooseFromMapRow.md)

# Called by

- [handle](../../../../../functions/src/editor/visualEditorProvider/EditorSession/handle.md)