---
type: TypeScript Function
title: extractTopicFromSectionCommand
resource: src/commands/extractTopicCommand.ts#L32-L144
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/sectionExtractor/findEnclosingSection
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/extractTopicCommand/detectNewTopicType
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/extractTopicCommand/slugify
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/commands/extractTopicCommand/buildExtractedTopicContent
    resolved_by: tree-sitter
    confidence: exact
  - target: functions/src/utils/logger/Logger/info
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/extension/registerCommands
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`async function extractTopicFromSectionCommand(): Promise<void>`

# Calls

- [findEnclosingSection](../../../../functions/src/utils/sectionExtractor/findEnclosingSection.md)
- [detectNewTopicType](../../../../functions/src/commands/extractTopicCommand/detectNewTopicType.md)
- [slugify](../../../../functions/src/commands/extractTopicCommand/slugify.md)
- [buildExtractedTopicContent](../../../../functions/src/commands/extractTopicCommand/buildExtractedTopicContent.md)
- [info](../../../../functions/src/utils/logger/Logger/info.md)

# Called by

- [registerCommands](../../../../functions/src/extension/registerCommands.md)