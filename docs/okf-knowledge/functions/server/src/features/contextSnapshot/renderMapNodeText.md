---
type: TypeScript Function
title: renderMapNodeText
resource: server/src/features/contextSnapshot.ts#L99-L124
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/contextSnapshot/isTopicRefNode
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/configurationManager/ConfigurationManager/get
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/contextSnapshot/countTopicRefs
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/contextSnapshot/buildLevel2
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function renderMapNodeText( node: MapNode | TopicRefNode, topicsMap: Map<string, TopicNode>, depth: number ): string[]`

# Calls

- [isTopicRefNode](../../../../../functions/server/src/features/contextSnapshot/isTopicRefNode.md)
- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [countTopicRefs](../../../../../functions/server/src/features/contextSnapshot/countTopicRefs.md)

# Called by

- [buildLevel2](../../../../../functions/server/src/features/contextSnapshot/buildLevel2.md)