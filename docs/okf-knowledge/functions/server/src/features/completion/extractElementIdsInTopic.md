---
type: TypeScript Function
title: extractElementIdsInTopic
resource: server/src/features/completion.ts#L639-L703
generated:
  by: okf-rs/0.7.0
relationships:
  calls:
  - target: functions/server/src/features/completion/extractTopicIds
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/shared/render/toHtml/Renderer/has
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
- [has](../../../../../functions/src/shared/render/toHtml/Renderer/has.md)

# Called by

- [getHrefFragmentCompletions](../../../../../functions/server/src/features/completion/getHrefFragmentCompletions.md)