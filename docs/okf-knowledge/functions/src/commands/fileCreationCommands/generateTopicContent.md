---
type: TypeScript Function
title: generateTopicContent
resource: src/commands/fileCreationCommands.ts#L715-L805
generated:
  by: okf-rs/0.7.0
relationships:
  called_by:
  - target: functions/src/commands/fileCreationCommands/newTopicCommand
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/fileCreationCommands/runProjectInit
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function generateTopicContent(topicType: string, id: string): string`

# Called by

- [newTopicCommand](../../../../functions/src/commands/fileCreationCommands/newTopicCommand.md)
- [runProjectInit](../../../../functions/src/commands/fileCreationCommands/runProjectInit.md)