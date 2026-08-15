---
type: TypeScript Function
title: isTopicRefNode
resource: server/src/features/contextSnapshot.ts#L38-L40
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/server/src/features/contextSnapshot/renderMapNodeXml
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextSnapshot/countTopicRefs
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextSnapshot/renderMapNodeText
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextSnapshot/collectRefs
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function isTopicRefNode(node: MapNode | TopicRefNode): node is TopicRefNode`

# Called by

- [renderMapNodeXml](../../../../../functions/server/src/features/contextSnapshot/renderMapNodeXml.md)
- [countTopicRefs](../../../../../functions/server/src/features/contextSnapshot/countTopicRefs.md)
- [renderMapNodeText](../../../../../functions/server/src/features/contextSnapshot/renderMapNodeText.md)
- [collectRefs](../../../../../functions/server/src/features/contextSnapshot/collectRefs.md)