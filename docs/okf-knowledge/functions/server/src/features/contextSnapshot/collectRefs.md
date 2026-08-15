---
type: TypeScript Function
title: collectRefs
resource: server/src/features/contextSnapshot.ts#L143-L151
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/contextSnapshot/isTopicRefNode
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/contextSnapshot/buildLevel3
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function collectRefs(node: MapNode | TopicRefNode): void`

# Calls

- [isTopicRefNode](../../../../../functions/server/src/features/contextSnapshot/isTopicRefNode.md)

# Called by

- [buildLevel3](../../../../../functions/server/src/features/contextSnapshot/buildLevel3.md)