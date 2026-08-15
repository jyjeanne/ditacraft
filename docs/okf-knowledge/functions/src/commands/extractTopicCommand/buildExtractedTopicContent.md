---
type: TypeScript Function
title: buildExtractedTopicContent
resource: src/commands/extractTopicCommand.ts#L192-L202
generated:
  by: okf-rs/0.4.0
relationships:
  called_by:
  - target: functions/src/commands/extractTopicCommand/extractTopicFromSectionCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function buildExtractedTopicContent(topicType: NewTopicType, id: string, title: string, bodyContent: string): string`

# Called by

- [extractTopicFromSectionCommand](../../../../functions/src/commands/extractTopicCommand/extractTopicFromSectionCommand.md)