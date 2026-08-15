---
type: TypeScript Function
title: countTopicRefs
resource: server/src/features/contextSnapshot.ts#L76-L86
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/contextSnapshot/isTopicRefNode
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/contextSnapshot/renderMapNodeXml
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextSnapshot/renderMapNodeText
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function countTopicRefs(node: MapNode): number`

# Calls

- [isTopicRefNode](../../../../../functions/server/src/features/contextSnapshot/isTopicRefNode.md)

# Called by

- [renderMapNodeXml](../../../../../functions/server/src/features/contextSnapshot/renderMapNodeXml.md)
- [renderMapNodeText](../../../../../functions/server/src/features/contextSnapshot/renderMapNodeText.md)