---
type: TypeScript Method
title: contextOf
resource: src/preview/mapContexts.ts#L177-L185
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/src/preview/mapContexts/MapContexts/places
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/stored
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/keyOf
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContext/samePlace
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/editor/visualEditorProvider/EditorSession/refreshContext
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/mapContexts/MapContexts/pick
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/preview/visualPreviewPanel/VisualPreviewPanel/refreshContext
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async contextOf(topicPath: string): Promise<TopicContext>`

# Calls

- [places](../../../../../functions/src/preview/mapContexts/MapContexts/places.md)
- [stored](../../../../../functions/src/preview/mapContexts/MapContexts/stored.md)
- [keyOf](../../../../../functions/src/preview/mapContexts/MapContexts/keyOf.md)
- [samePlace](../../../../../functions/src/preview/mapContext/samePlace.md)

# Called by

- [refreshContext](../../../../../functions/src/editor/visualEditorProvider/EditorSession/refreshContext.md)
- [pick](../../../../../functions/src/preview/mapContexts/MapContexts/pick.md)
- [refreshContext](../../../../../functions/src/preview/visualPreviewPanel/VisualPreviewPanel/refreshContext.md)