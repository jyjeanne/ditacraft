---
type: TypeScript Function
title: extractTopicIds
resource: server/src/features/completion.ts#L609-L619
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/server/src/features/completion/getHrefFragmentCompletions
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/server/src/features/completion/extractElementIdsInTopic
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function extractTopicIds(content: string): string[]`

# Called by

- [getHrefFragmentCompletions](../../../../../functions/server/src/features/completion/getHrefFragmentCompletions.md)
- [extractElementIdsInTopic](../../../../../functions/server/src/features/completion/extractElementIdsInTopic.md)