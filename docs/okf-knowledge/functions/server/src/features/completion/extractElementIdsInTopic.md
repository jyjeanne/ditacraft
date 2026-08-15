---
type: TypeScript Function
title: extractElementIdsInTopic
resource: server/src/features/completion.ts#L638-L702
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/server/src/features/completion/extractTopicIds
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/server/src/features/completion/getHrefFragmentCompletions
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function extractElementIdsInTopic(content: string, topicId: string): string[]`

# Calls

- [extractTopicIds](../../../../../functions/server/src/features/completion/extractTopicIds.md)

# Called by

- [getHrefFragmentCompletions](../../../../../functions/server/src/features/completion/getHrefFragmentCompletions.md)