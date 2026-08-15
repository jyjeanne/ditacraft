---
type: TypeScript Function
title: renderMapNodeXml
resource: server/src/features/contextSnapshot.ts#L42-L74
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
  - target: functions/server/src/features/contextSnapshot/buildLevel1
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function renderMapNodeXml( node: MapNode | TopicRefNode, topicsMap: Map<string, TopicNode>, depth: number, maxDepth: number ): string`

# Calls

- [isTopicRefNode](../../../../../functions/server/src/features/contextSnapshot/isTopicRefNode.md)
- [get](../../../../../functions/src/utils/configurationManager/ConfigurationManager/get.md)
- [countTopicRefs](../../../../../functions/server/src/features/contextSnapshot/countTopicRefs.md)

# Called by

- [buildLevel1](../../../../../functions/server/src/features/contextSnapshot/buildLevel1.md)