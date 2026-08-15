---
type: TypeScript Function
title: findEnclosingSection
resource: src/utils/sectionExtractor.ts#L48-L101
generated:
  by: okf-rs/0.4.0
relationships:
  calls:
  - target: functions/src/utils/sectionExtractor/buildExtractedSection
    resolved_by: tree-sitter
    confidence: exact
  called_by:
  - target: functions/src/commands/extractTopicCommand/extractTopicFromSectionCommand
    resolved_by: tree-sitter
    confidence: exact
---

# Signature

`function findEnclosingSection(text: string, offset: number): ExtractedSection | undefined`

# Calls

- [buildExtractedSection](../../../../functions/src/utils/sectionExtractor/buildExtractedSection.md)

# Called by

- [extractTopicFromSectionCommand](../../../../functions/src/commands/extractTopicCommand/extractTopicFromSectionCommand.md)